import { generateMnemonic } from 'bip39';

/**
 * Funds the test wallet against the running cluster, so a test needing leaves
 * does not need the cluster restarted. Served by `regtest_up`, which holds the
 * one wallet that can claim a deposit here.
 */
const FUND_URL = process.env.TEST_FUND_URL || 'http://127.0.0.1:8997';

export const isFundingReachable = async (): Promise<boolean> => {
  try {
    const response = await fetch(FUND_URL, { signal: AbortSignal.timeout(2_000) });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Sends `count` transfers of `sats` to the wallet `mnemonic` owns. Each lands as
 * its own leaf. Slow: every round is a deposit, a confirmation and a sync.
 */
export const fundTestWallet = async (
  mnemonic: string,
  sats: number,
  count: number,
): Promise<void> => {
  const query = new URLSearchParams({ sats: String(sats), count: String(count), mnemonic });
  const response = await fetch(`${FUND_URL}/fund?${query}`, {
    signal: AbortSignal.timeout(10 * 60_000),
  });
  const body = (await response.json()) as { funded?: number; error?: string };
  if (body.error) throw new Error(`funding the test wallet failed: ${body.error}`);
  if (body.funded !== count) throw new Error(`funded ${body.funded} of ${count} rounds`);
};

/**
 * A wallet nothing has touched. Leaves survive a failed exit, so a test reusing
 * a phrase inherits whatever the last run left behind: each run gets its own.
 */
export const freshMnemonic = (): string => generateMnemonic(128);
