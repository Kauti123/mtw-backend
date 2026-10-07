export interface PaymentChargeInput {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentChargeResult {
  provider: string;
  providerPaymentId: string;
  status: 'captured' | 'pending' | 'failed';
  raw?: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  charge(input: PaymentChargeInput): Promise<PaymentChargeResult>;
  refund(providerPaymentId: string, amount?: number): Promise<{ status: string }>;
}

export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = 'razorpay';

  async charge(input: PaymentChargeInput): Promise<PaymentChargeResult> {
    return {
      provider: this.name,
      providerPaymentId: `rzp_mock_${input.orderId}`,
      status: 'captured',
    };
  }

  async refund(providerPaymentId: string): Promise<{ status: string }> {
    return { status: 'refunded', ...(providerPaymentId ? {} : {}) };
  }
}

export class PayuPaymentProvider implements PaymentProvider {
  readonly name = 'payu';

  async charge(input: PaymentChargeInput): Promise<PaymentChargeResult> {
    return {
      provider: this.name,
      providerPaymentId: `payu_mock_${input.orderId}`,
      status: 'captured',
    };
  }

  async refund(providerPaymentId: string): Promise<{ status: string }> {
    return { status: 'refunded', ...(providerPaymentId ? {} : {}) };
  }
}

export function createPaymentProvider(name: string): PaymentProvider {
  switch (name) {
    case 'payu':
      return new PayuPaymentProvider();
    case 'razorpay':
    default:
      return new RazorpayPaymentProvider();
  }
}
