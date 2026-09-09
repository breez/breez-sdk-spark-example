// Service to manage rejected deposits state
// Stores which deposits have been rejected by the user

const REJECTED_DEPOSITS_KEY = 'rejected_deposits_v1';

export interface RejectedDeposit {
  txid: string;
  vout: number;
  rejectedAt: number; // timestamp
}

// In-memory cache for rejected deposits (js-cache-storage optimization)
let cachedDeposits: RejectedDeposit[] | null = null;

/**
 * Get the list of all rejected deposits
 */
export function getRejectedDeposits(): RejectedDeposit[] {
  if (cachedDeposits !== null) {
    return cachedDeposits;
  }
  try {
    const raw = localStorage.getItem(REJECTED_DEPOSITS_KEY);
    if (!raw) {
      cachedDeposits = [];
      return cachedDeposits;
    }
    const parsed = JSON.parse(raw);
    cachedDeposits = Array.isArray(parsed) ? parsed : [];
    return cachedDeposits;
  } catch {
    cachedDeposits = [];
    return cachedDeposits;
  }
}

/**
 * Check if a specific deposit has been rejected
 */
export function isDepositRejected(txid: string, vout: number): boolean {
  const rejected = getRejectedDeposits();
  return rejected.some(d => d.txid === txid && d.vout === vout);
}

/**
 * Mark a deposit as rejected
 */
export function rejectDeposit(txid: string, vout: number): void {
  const rejected = getRejectedDeposits();

  // Avoid duplicates
  if (rejected.some(d => d.txid === txid && d.vout === vout)) {
    return;
  }

  rejected.push({
    txid,
    vout,
    rejectedAt: Date.now(),
  });

  localStorage.setItem(REJECTED_DEPOSITS_KEY, JSON.stringify(rejected));
  cachedDeposits = rejected; // Update cache
}

/**
 * Remove a deposit from the rejected list (e.g., after successful refund or claim)
 */
export function removeRejectedDeposit(txid: string, vout: number): void {
  const rejected = getRejectedDeposits();
  const filtered = rejected.filter(d => !(d.txid === txid && d.vout === vout));
  localStorage.setItem(REJECTED_DEPOSITS_KEY, JSON.stringify(filtered));
  cachedDeposits = filtered; // Update cache
}

/** Wipe all rejected deposits. Used on logout — list is wallet-specific. */
export function clearRejectedDeposits(): void {
  localStorage.removeItem(REJECTED_DEPOSITS_KEY);
  cachedDeposits = [];
}

// ---------------------------------------------------------------------------
// Submitted claim receipts
// ---------------------------------------------------------------------------

/**
 * What an early claim was priced at when it was sent. The SDK reports a
 * submitted claim as `{ type: 'submitted', claimId }` and keeps no fee on the
 * deposit, so once the sheet is reopened mid-settlement the figure the user
 * agreed to is unrecoverable. A fresh quote is a different number, not that one.
 */
const CLAIM_FEES_KEY = 'deposit_claim_fees_v1';

export interface ClaimReceipt {
  feeSats: number;
  creditAmountSats: number;
  claimedAt: number;
}

/** A settled claim leaves nothing behind to clear its receipt, so they age out. */
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

const outpoint = (txid: string, vout: number) => `${txid}:${vout}`;

let cachedReceipts: Record<string, ClaimReceipt> | null = null;

function getReceipts(): Record<string, ClaimReceipt> {
  if (cachedReceipts !== null) return cachedReceipts;
  let loaded: Record<string, ClaimReceipt> = {};
  try {
    const raw = localStorage.getItem(CLAIM_FEES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) loaded = parsed;
  } catch {
    loaded = {};
  }
  cachedReceipts = loaded;
  return loaded;
}

function writeReceipts(next: Record<string, ClaimReceipt>): void {
  localStorage.setItem(CLAIM_FEES_KEY, JSON.stringify(next));
  cachedReceipts = next;
}

/** Records what a claim was priced at, and drops any that have aged out. */
export function rememberClaimFee(
  txid: string,
  vout: number,
  receipt: Omit<ClaimReceipt, 'claimedAt'>,
): void {
  const now = Date.now();
  const kept = Object.fromEntries(
    Object.entries(getReceipts()).filter(([, r]) => now - r.claimedAt < RECEIPT_TTL_MS),
  );
  kept[outpoint(txid, vout)] = { ...receipt, claimedAt: now };
  writeReceipts(kept);
}

export function readClaimFee(txid: string, vout: number): ClaimReceipt | null {
  const found = getReceipts()[outpoint(txid, vout)];
  if (!found) return null;
  return Date.now() - found.claimedAt < RECEIPT_TTL_MS ? found : null;
}

export function forgetClaimFee(txid: string, vout: number): void {
  const next = { ...getReceipts() };
  delete next[outpoint(txid, vout)];
  writeReceipts(next);
}

/** Wipe all receipts. Used on logout: they are wallet-specific. */
export function clearClaimFees(): void {
  localStorage.removeItem(CLAIM_FEES_KEY);
  cachedReceipts = {};
}
