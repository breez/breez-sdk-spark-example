import { archiveExit, loadArchive } from './archive';
import { confirmed, plan, tx } from './testFixtures';
import { beforeEach, describe, expect, it } from 'vitest';

const wallet = { identityPubkey: 'pubkey-0000000000000000', network: 'regtest' };

// One output of 596 524 sats, so the archive records what landed rather than
// what the balance was.
const sweepHex =
  '0200000001' + '00'.repeat(32) + '00000000' + '00' + 'ffffffff' +
  '01' + '2c1a090000000000' + '160014' + 'ab'.repeat(20) + '00000000';

const finished = (txid: string, deliveredSat: number) =>
  plan([tx({ txid, kind: 'sweep', txHex: '00', status: confirmed(10) })], {
    phase: 'complete',
    destination: `bcrt1-${txid}`,
    quotedSweepFeeSat: 0,
    exit: { recoverableValueSat: deliveredSat },
  });

describe('archiveExit', () => {
  beforeEach(() => localStorage.clear());

  it('has nothing before an exit finishes', () => {
    expect(loadArchive(wallet)).toEqual([]);
  });

  it('keeps what the exit delivered and where it went', () => {
    archiveExit(wallet, finished('sweep-a', 50_000));

    expect(loadArchive(wallet)).toMatchObject([
      { id: 'sweep-a', destination: 'bcrt1-sweep-a', deliveredSat: 50_000 },
    ]);
  });

  it('records what the sweep paid out, not what the balance was', () => {
    archiveExit(
      wallet,
      plan([tx({ txid: 'sweep-real', kind: 'sweep', txHex: sweepHex, status: confirmed(10) })], {
        phase: 'complete',
        exit: { recoverableValueSat: 600_000 },
      }),
    );

    expect(loadArchive(wallet)[0].deliveredSat).toBe(596_524);
  });

  it('records the same exit once, however many passes report it', () => {
    archiveExit(wallet, finished('sweep-a', 50_000));
    archiveExit(wallet, finished('sweep-a', 50_000));

    expect(loadArchive(wallet)).toHaveLength(1);
  });

  it('keeps an earlier exit when a later one finishes, newest first', () => {
    archiveExit(wallet, finished('sweep-a', 50_000));
    archiveExit(wallet, finished('sweep-b', 70_000));

    expect(loadArchive(wallet).map(entry => entry.id)).toEqual(['sweep-b', 'sweep-a']);
  });

  it('ignores a plan that never built a sweep', () => {
    archiveExit(wallet, plan([tx({ txid: 'node-a' })], { phase: 'complete' }));

    expect(loadArchive(wallet)).toEqual([]);
  });

  it('keeps each wallet\'s exits apart', () => {
    archiveExit(wallet, finished('sweep-a', 50_000));

    expect(loadArchive({ ...wallet, network: 'mainnet' })).toEqual([]);
  });
});
