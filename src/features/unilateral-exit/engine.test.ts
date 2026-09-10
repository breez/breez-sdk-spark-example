import { dismissUnilateralExitPlan, getUnilateralExitState, pollIntervalMs, setUnilateralExitPlan, startUnilateralExitEngine, stopUnilateralExitEngine } from './engine';
import { loadPlan } from './driver';
import { confirmed, plan, tx } from './testFixtures';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChainClient } from '@/services/chain';

const wallet = { identityPubkey: 'pubkey', network: 'regtest' };

const chain: ChainClient = {
  feeRates: async () => ({ slow: 1, medium: 1, fast: 1 }),
  addressUtxos: async () => [],
  tipHeight: async () => 100,
  broadcast: async () => undefined,
  broadcastPackage: async () => undefined,
};

const done = plan([tx({ txid: 's', kind: 'sweep', status: confirmed(1) })], { network: 'regtest', phase: 'complete' });

describe('the plan the engine holds', () => {
  beforeEach(() => {
    localStorage.clear();
    stopUnilateralExitEngine();
  });

  it('keeps a completed plan on disk so the outcome survives a reload', () => {
    startUnilateralExitEngine(wallet, chain);
    setUnilateralExitPlan(wallet, done);
    expect(loadPlan(wallet)?.phase).toBe('complete');
    expect(getUnilateralExitState().plan?.phase).toBe('complete');
  });

  it('stores a plan even when it is not running for that wallet, for when it does', () => {
    setUnilateralExitPlan(wallet, done);
    expect(getUnilateralExitState().plan).toBeNull();
    startUnilateralExitEngine(wallet, chain);
    expect(getUnilateralExitState().plan?.phase).toBe('complete');
  });

  it('drops the plan once the user acknowledges it, freeing the next exit', () => {
    startUnilateralExitEngine(wallet, chain);
    setUnilateralExitPlan(wallet, done);
    dismissUnilateralExitPlan();
    expect(loadPlan(wallet)).toBeNull();
    expect(getUnilateralExitState().plan).toBeNull();
  });
});

describe('pollIntervalMs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('polls fast on regtest, where blocks come from a keyboard', () => {
    expect(pollIntervalMs('regtest')).toBe(5_000);
  });

  it('leaves a live chain on the slow default', () => {
    expect(pollIntervalMs('mainnet')).toBe(30_000);
  });

  it('lets the environment override any network', () => {
    vi.stubEnv('VITE_UNILATERAL_EXIT_POLL_SECS', '2');
    expect(pollIntervalMs('mainnet')).toBe(2_000);
  });

  it('ignores an override that is not a positive number', () => {
    vi.stubEnv('VITE_UNILATERAL_EXIT_POLL_SECS', 'soon');
    expect(pollIntervalMs('regtest')).toBe(5_000);
    vi.stubEnv('VITE_UNILATERAL_EXIT_POLL_SECS', '0');
    expect(pollIntervalMs('regtest')).toBe(5_000);
  });
});
