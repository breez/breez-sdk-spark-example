import { logger, LogCategory } from '@/services/logger';
import { willReceiveSat } from './driver';
import type { UnilateralExitPlan, WalletKey } from './driver';

/**
 * A finished exit, kept once its plan slot is handed to the next one. The plan
 * lives at a single key per wallet, so without this a second exit erases the
 * record of the first.
 */
export interface ArchivedExit {
  /** The sweep that delivered the money, which is what makes an exit unique. */
  id: string;
  destination: string;
  deliveredSat: number;
  completedAt: number;
}

const key = ({ identityPubkey, network }: WalletKey): string =>
  `unilateral-exit-archive:${identityPubkey.slice(0, 16)}:${network}`;

/** The sweep's txid, or null for a plan that never built one. */
const sweepTxid = (plan: UnilateralExitPlan): string | null =>
  plan.exit.transactions.find(tx => tx.kind === 'sweep')?.txid ?? null;

export function loadArchive(wallet: WalletKey): ArchivedExit[] {
  const raw = localStorage.getItem(key(wallet));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ArchivedExit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Records a finished exit, newest first. Keyed on the sweep, so an engine that
 * reports the same completion on every pass does not stack up duplicates.
 */
export function archiveExit(wallet: WalletKey, plan: UnilateralExitPlan): ArchivedExit[] {
  const id = sweepTxid(plan);
  if (id === null) return loadArchive(wallet);

  const existing = loadArchive(wallet);
  if (existing.some(entry => entry.id === id)) return existing;

  const next = [
    {
      id,
      destination: plan.destination,
      deliveredSat: willReceiveSat(plan),
      completedAt: Date.now(),
    },
    ...existing,
  ];
  try {
    localStorage.setItem(key(wallet), JSON.stringify(next));
  } catch (e) {
    logger.error(LogCategory.SDK, 'Failed to archive a finished unilateral exit', {
      error: e instanceof Error ? e.message : String(e),
    });
    return existing;
  }
  return next;
}
