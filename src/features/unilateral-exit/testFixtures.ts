import type {
  ExitTransactionStatus,
  PrepareUnilateralExitResponse,
  UnilateralExitResponse,
  UnilateralExitTransaction,
} from '@breeztech/breez-sdk-spark';
import type { ExitSdk, UnilateralExitPlan } from './driver';

export const confirmed = (blockHeight?: number): ExitTransactionStatus => ({
  type: 'confirmed',
  blockHeight,
});
export const ready: ExitTransactionStatus = { type: 'ready' };
export const blocked: ExitTransactionStatus = { type: 'waitingForDependencies' };
export const locked = (spendableAtHeight?: number): ExitTransactionStatus => ({
  type: 'waitingForTimelock',
  spendableAtHeight,
});

export const tx = (
  over: Partial<UnilateralExitTransaction> & { txid: string },
): UnilateralExitTransaction => ({
  kind: 'node',
  txHex: 'aa',
  dependsOn: [],
  status: ready,
  ...over,
});

/** What the sdk hands back for an exit: the same set, statuses refreshed. */
export const checked = (
  transactions: Array<Partial<UnilateralExitTransaction> & { txid: string }>,
  over: Partial<UnilateralExitResponse> = {},
): UnilateralExitResponse => ({
  recoverableValueSat: 100_000,
  totalFeeSat: 2_000,
  cpfpFeeSat: 1_800,
  fanoutFeeSat: 0,
  sweepFeeSat: 200,
  leaves: [{ leafId: 'leaf-1', value: 100_000 }],
  fundingInputs: [],
  transactions: transactions.map(tx),
  ...over,
});

export const plan = (
  transactions: UnilateralExitTransaction[],
  over: Partial<Omit<UnilateralExitPlan, 'exit'>> & { exit?: Partial<UnilateralExitResponse> } = {},
): UnilateralExitPlan => {
  const { exit, ...rest } = over;
  return {
    version: 4,
    network: 'mainnet',
    destination: 'bc1qdest',
    feeRateSatPerVbyte: 2,
    fundingAddressIndex: 0,
    quotedSweepFeeSat: 200,
    exit: { ...checked([]), transactions, ...exit },
    refusals: {},
    phase: 'active',
    ...rest,
  };
};

export const prepared = (
  over: Partial<PrepareUnilateralExitResponse> = {},
): PrepareUnilateralExitResponse => ({
  leaves: [{ leafId: 'leaf-1', value: 100_000 }],
  recoverableValueSat: 100_000,
  totalFeeSat: 2_000,
  cpfpFeeSat: 1_800,
  fanoutFeeSat: 0,
  sweepFeeSat: 200,
  singleUtxoFundingSat: 3_000,
  perBranchFunding: [],
  feeRateSatPerVbyte: 2,
  destination: 'bc1qdest',
  exitChainState: {
    confirmedNodes: [],
    refunds: [],
    stoppedLeafIds: [],
    unverifiedNodeIds: [],
    unverifiableConfirmedNodeIds: [],
  },
  ...over,
});

/** An sdk whose check confirms whatever it is handed, with nothing to rebuild. */
export const sdk = (over: Partial<ExitSdk> = {}): ExitSdk => ({
  checkUnilateralExit: async ({ exit }) => ({ exit, verdict: { type: 'valid' } }),
  importUnilateralExitState: async () => ({
    importedLeaves: 0,
    skippedForeignLeaves: 0,
    skippedConflictingLeaves: 0,
    skippedChains: 0,
  }),
  prepareUnilateralExit: async () => prepared({ leaves: [] }),
  unilateralExit: async () => checked([]),
  ...over,
});
