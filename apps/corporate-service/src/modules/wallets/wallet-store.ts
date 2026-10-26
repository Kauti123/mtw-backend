import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type WalletTxnType = 'DEPOSIT' | 'CREDIT' | 'UTILIZATION' | 'REFUND';
export type WalletStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type WalletSource = 'DEPOSIT' | 'CREDIT';

export type WalletTransaction = {
  id: string;
  corporateId: string;
  corporateName?: string | null;
  type: WalletTxnType;
  amount: number;
  reference: string | null;
  note: string | null;
  sourceWallet?: WalletSource | null;
  status: WalletStatus;
  createdAt: string;
};

export type WalletBalance = {
  corporateId: string;
  deposit: number;
  credit: number;
  available: number;
  creditLimit: number;
  extraCredit: number;
  depositPool: number;
  depositEnabled: boolean;
  creditEnabled: boolean;
};

function walletFile() {
  const fromEnv = String(process.env.WALLET_STORE_PATH || '').trim();
  if (fromEnv) return fromEnv;
  const local = path.resolve(process.cwd(), '.data', 'corporate-wallets.json');
  const shared = path.resolve(
    process.cwd(),
    '..',
    '..',
    'misba_updated',
    '.data',
    'corporate-wallets.json',
  );
  if (existsSync(local)) return local;
  if (existsSync(shared)) return shared;
  return local;
}

let writeChain = Promise.resolve();

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function httpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function text(value: unknown) {
  const raw = String(value ?? '').trim();
  return raw || null;
}

function normalize(row: WalletTransaction): WalletTransaction {
  const source =
    row.sourceWallet === 'DEPOSIT' || row.sourceWallet === 'CREDIT' ? row.sourceWallet : null;
  return {
    ...row,
    status: row.status || 'ACCEPTED',
    sourceWallet: source,
  };
}

function isAccepted(row: WalletTransaction) {
  return row.status !== 'PENDING' && row.status !== 'REJECTED';
}

async function load(): Promise<WalletTransaction[]> {
  try {
    const parsed = JSON.parse(await readFile(walletFile(), 'utf8')) as WalletTransaction[];
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch {
    return [];
  }
}

async function persist(rows: WalletTransaction[]) {
  const file = walletFile();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(rows, null, 2), 'utf8');
}

export function summarizeWallet(
  rows: WalletTransaction[],
  input?: { creditLimit?: number; depositEnabled?: boolean; creditEnabled?: boolean },
) {
  const depositEnabled = input?.depositEnabled !== false;
  const creditEnabled = input?.creditEnabled !== false;
  const creditLimit = Math.max(0, Number(input?.creditLimit ?? 0) || 0);
  let depositPool = 0;
  let extraCredit = 0;
  let depositUsed = 0;
  let creditUsed = 0;
  let unspecifiedUsed = 0;
  for (const txn of rows) {
    if (!isAccepted(txn)) continue;
    if (txn.type === 'DEPOSIT') depositPool += txn.amount;
    else if (txn.type === 'CREDIT') extraCredit += txn.amount;
    else if (txn.type === 'UTILIZATION') {
      if (txn.sourceWallet === 'DEPOSIT') depositUsed += txn.amount;
      else if (txn.sourceWallet === 'CREDIT') creditUsed += txn.amount;
      else unspecifiedUsed += txn.amount;
    } else if (txn.type === 'REFUND') {
      if (txn.sourceWallet === 'DEPOSIT') depositUsed -= txn.amount;
      else if (txn.sourceWallet === 'CREDIT') creditUsed -= txn.amount;
      else unspecifiedUsed -= txn.amount;
    }
  }
  let deposit = Math.max(0, depositPool - depositUsed);
  let credit = Math.max(0, creditLimit + extraCredit - creditUsed);
  if (unspecifiedUsed > 0) {
    const fromDeposit = Math.min(deposit, unspecifiedUsed);
    deposit -= fromDeposit;
    credit = Math.max(0, credit - (unspecifiedUsed - fromDeposit));
  } else if (unspecifiedUsed < 0) {
    deposit += -unspecifiedUsed;
  }
  if (!depositEnabled) deposit = 0;
  if (!creditEnabled) credit = 0;
  return {
    deposit,
    credit,
    available: deposit + credit,
    creditLimit,
    extraCredit,
    depositPool,
    depositEnabled,
    creditEnabled,
  };
}

export async function getWalletBalance(input: {
  corporateId: string;
  creditLimit?: number;
  depositEnabled?: boolean;
  creditEnabled?: boolean;
}): Promise<WalletBalance> {
  const corporateId = String(input.corporateId ?? '').trim();
  if (!corporateId) throw httpError('Corporate is required', 400);
  const rows = (await load()).filter((row) => row.corporateId === corporateId);
  return { corporateId, ...summarizeWallet(rows, input) };
}

function newUtilization(input: {
  corporateId: string;
  corporateName?: string | null;
  amount: number;
  sourceWallet: WalletSource;
  reference: string | null;
  note: string | null;
}): WalletTransaction {
  return {
    id: `wlt_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    corporateId: input.corporateId,
    corporateName: text(input.corporateName),
    type: 'UTILIZATION',
    amount: input.amount,
    reference: input.reference,
    note: input.note,
    sourceWallet: input.sourceWallet,
    status: 'ACCEPTED',
    createdAt: new Date().toISOString(),
  };
}

export async function consumeWallet(input: {
  corporateId: string;
  corporateName?: string | null;
  amount: number;
  creditLimit?: number;
  depositEnabled?: boolean;
  creditEnabled?: boolean;
  reference?: string | null;
  note?: string | null;
}) {
  return withWriteLock(async () => {
    const corporateId = String(input.corporateId ?? '').trim();
    const amount = Number(input.amount ?? 0);
    if (!corporateId) throw httpError('Corporate is required', 400);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw httpError('Amount must be greater than 0', 400);
    }
    const reference = text(input.reference);
    const rows = await load();
    if (reference) {
      const existing = rows.filter(
        (row) =>
          row.corporateId === corporateId &&
          row.type === 'UTILIZATION' &&
          isAccepted(row) &&
          row.reference === reference,
      );
      if (existing.length) {
        const corpRows = rows.filter((row) => row.corporateId === corporateId);
        return {
          alreadyConsumed: true,
          items: existing,
          balance: { corporateId, ...summarizeWallet(corpRows, input) },
        };
      }
    }
    const corpRows = rows.filter((row) => row.corporateId === corporateId);
    const balance = summarizeWallet(corpRows, input);
    if (balance.available + 1e-9 < amount) {
      throw httpError('Corporate wallet has insufficient balance', 400);
    }
    const fromDeposit = Math.min(balance.deposit, amount);
    const fromCredit = Number((amount - fromDeposit).toFixed(2));
    const created: WalletTransaction[] = [];
    const note = text(input.note);
    if (fromDeposit > 0) {
      created.push(
        newUtilization({
          corporateId,
          corporateName: input.corporateName,
          amount: Number(fromDeposit.toFixed(2)),
          sourceWallet: 'DEPOSIT',
          reference,
          note: note || 'Booking deducted from deposit wallet',
        }),
      );
    }
    if (fromCredit > 0) {
      created.push(
        newUtilization({
          corporateId,
          corporateName: input.corporateName,
          amount: fromCredit,
          sourceWallet: 'CREDIT',
          reference,
          note: note || 'Booking deducted from credit wallet',
        }),
      );
    }
    rows.unshift(...created);
    await persist(rows);
    const nextRows = rows.filter((row) => row.corporateId === corporateId);
    return {
      alreadyConsumed: false,
      items: created,
      balance: { corporateId, ...summarizeWallet(nextRows, input) },
    };
  });
}
