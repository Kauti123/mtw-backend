import { BadRequestException, Injectable } from '@nestjs/common';
import { CorporateService } from '../corporates/corporates.service';
import type { CorporateRecord } from '../corporates/dto';
import { consumeWallet, getWalletBalance } from './wallet-store';

export type CorporateBillingFlags = {
  creditLimit: number;
  depositEnabled: boolean;
  creditEnabled: boolean;
  gatewayEnabled: boolean;
  currency: string;
  corporateName: string;
};

function collectModes(value: unknown, selected: Set<string>) {
  if (Array.isArray(value)) {
    for (const item of value) collectModes(item, selected);
    return;
  }
  if (typeof value !== 'string') return;
  for (const part of value.split(/[|,]/)) {
    const token = part.trim();
    if (token) selected.add(token);
  }
}

export function billingFromCorporate(corp: CorporateRecord): CorporateBillingFlags {
  const billing = corp.creditAndBilling ?? {};
  const selected = new Set<string>();
  collectModes(billing.billingModes, selected);
  collectModes(billing.billingMode, selected);
  collectModes((corp as { billingModes?: unknown }).billingModes, selected);
  collectModes((corp as { billingMode?: unknown }).billingMode, selected);
  if (billing.creditWallet === true) selected.add('Credit Wallet');
  if (billing.depositWallet === true) selected.add('Deposit Wallet');
  if (billing.paymentGateway === true) selected.add('Payment Gateway');
  const explicit = Array.isArray(billing.billingModes) && billing.billingModes.length > 0;
  if (
    !explicit &&
    billing.depositWallet !== false &&
    (selected.has('Credit Wallet') || Number(billing.creditLimit) > 0)
  ) {
    selected.add('Credit Wallet');
    selected.add('Deposit Wallet');
  }
  const account = corp.accountConfiguration;
  return {
    creditLimit: Math.max(0, Number(billing.creditLimit ?? 0) || 0),
    depositEnabled: selected.has('Deposit Wallet'),
    creditEnabled: selected.has('Credit Wallet'),
    gatewayEnabled: selected.has('Payment Gateway'),
    currency: String(
      account?.currency || (corp as { defaultCurrency?: string }).defaultCurrency || 'INR',
    ),
    corporateName: corp.companyName,
  };
}

function rethrow(error: unknown): never {
  const statusCode = Number((error as { statusCode?: number })?.statusCode) || 500;
  const message = error instanceof Error ? error.message : 'Wallet request failed';
  if (statusCode === 400) throw new BadRequestException(message);
  throw error;
}

@Injectable()
export class WalletsService {
  constructor(private readonly corporates: CorporateService) {}

  async snapshot(corporateId: string) {
    const id = String(corporateId || '').trim();
    if (!id) throw new BadRequestException('Corporate is required');
    const corp = await this.corporates.getCorporateById(id);
    const billing = billingFromCorporate(corp);
    try {
      const balance = await getWalletBalance({
        corporateId: corp.id,
        creditLimit: billing.creditLimit,
        depositEnabled: billing.depositEnabled,
        creditEnabled: billing.creditEnabled,
      });
      const walletEnabled = billing.depositEnabled || billing.creditEnabled;
      return {
        ...balance,
        ...billing,
        walletEnabled,
        selectable: walletEnabled && balance.available > 0,
      };
    } catch (error) {
      rethrow(error);
    }
  }

  async consume(input: {
    corporateId?: string;
    amount?: number;
    reference?: string | null;
    note?: string | null;
  }) {
    const id = String(input.corporateId || '').trim();
    if (!id) throw new BadRequestException('Corporate is required');
    const corp = await this.corporates.getCorporateById(id);
    const billing = billingFromCorporate(corp);
    if (!billing.depositEnabled && !billing.creditEnabled) {
      throw new BadRequestException('Corporate wallet is not enabled for this account');
    }
    try {
      return await consumeWallet({
        corporateId: corp.id,
        corporateName: billing.corporateName,
        amount: Number(input.amount ?? 0),
        creditLimit: billing.creditLimit,
        depositEnabled: billing.depositEnabled,
        creditEnabled: billing.creditEnabled,
        reference: input.reference,
        note: input.note,
      });
    } catch (error) {
      rethrow(error);
    }
  }
}
