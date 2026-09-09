import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TrackerView } from './TrackerView';

// The backup card reads the connected wallet; the tracker itself works off the
// plan it is handed.
vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => ({ exportUnilateralExitState: async () => ({ exitState: '{}' }) }),
}));
import type { UnilateralExitPlan } from './driver';
import { blocked, confirmed, locked, plan, tx } from './testFixtures';

// one input, one 596 524 sat output
const twoLeaves = (transactions: Parameters<typeof plan>[0], over: Parameters<typeof plan>[1] = {}) =>
  plan(transactions, {
    quotedSweepFeeSat: 215,
    ...over,
    exit: {
      leaves: [
        { leafId: 'leaf-1', value: 180_000 },
        { leafId: 'leaf-2', value: 420_000 },
      ],
      recoverableValueSat: 600_000,
      totalFeeSat: 3_122,
      cpfpFeeSat: 2_907,
      sweepFeeSat: 0,
      ...over.exit,
    },
  });

const renderTracker = (p: UnilateralExitPlan, tipHeight: number | null = 1000, onRebuild = vi.fn()) =>
  render(<TrackerView plan={p} tipHeight={tipHeight} isAdvancing={false} onRebuild={onRebuild} />);

describe('what the exit is worth right now', () => {
  it('counts only the sats that reached the destination, against the whole balance', () => {
    renderTracker(
      twoLeaves([
        tx({ txid: 'r1', kind: 'refund', nodeId: 'leaf-1', status: confirmed(900) }),
        tx({ txid: 'r2', kind: 'refund', nodeId: 'leaf-2', status: blocked }),
      ]),
    );
    const stages = screen.getByTestId('unilateral-exit-stages');
    expect(stages).toHaveTextContent('Processed sats');
    // Nothing is spendable until the sweep lands, so the numerator is still 0.
    expect(stages).toHaveTextContent('0/600 000');
  });

  it('leads with what will arrive: the balance less the sweep fee', () => {
    renderTracker(twoLeaves([tx({ txid: 'a' })]));
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText(/599 785/)).toBeInTheDocument();
  });

  it('counts the transactions done against the total', () => {
    renderTracker(
      plan([tx({ txid: 'a', status: confirmed(900) }), tx({ txid: 'r', kind: 'refund', status: locked(3000) })]),
    );
    const stages = screen.getByTestId('unilateral-exit-stages');
    expect(stages).toHaveTextContent('Processed transactions');
    expect(stages).toHaveTextContent('1/2');
  });

  it('names what the exit is waiting on', () => {
    renderTracker(
      plan([
        tx({ txid: 'r1', kind: 'refund', status: locked(1144) }),
        tx({ txid: 'r2', kind: 'refund', status: locked(1144) }),
        tx({ txid: 's', kind: 'sweep', status: locked(9000) }),
      ]),
    );
    expect(screen.getByTestId('unilateral-exit-status')).toHaveTextContent('Waiting for timelock');
  });

  it('estimates the whole wait, not just the next step, and marks it approximate', () => {
    renderTracker(
      plan([
        tx({ txid: 'a', status: confirmed(1000) }),
        tx({ txid: 'r', kind: 'refund', dependsOn: ['a'], csvTimelockBlocks: 2000, status: locked(3000) }),
      ]),
    );
    expect(screen.getByTestId('unilateral-exit-eta')).toHaveTextContent('~14');
  });

  it('says it is rebuilding rather than moving when the chain diverged', () => {
    renderTracker(plan([tx({ txid: 'a' })], { phase: 'redo' }));
    expect(screen.getByText('This exit needs rebuilding')).toBeInTheDocument();
  });
});

describe('TrackerView', () => {
  it('offers a rebuild when the chain no longer matches the exit', () => {
    const onRebuild = vi.fn();
    renderTracker(plan([tx({ txid: 'a' })], { phase: 'redo' }), 1000, onRebuild);
    expect(screen.getByText('Rebuild to keep going')).toBeInTheDocument();
    screen.getByTestId('unilateral-exit-rebuild').click();
    expect(onRebuild).toHaveBeenCalled();
  });

  it('offers a fee bump while the exit is still running', () => {
    const onRebuild = vi.fn();
    renderTracker(plan([tx({ txid: 'a' })]), 1000, onRebuild);
    // Kept out of the way under Advanced: an exit that is simply slow is not a
    // reason to put a rebuild in front of everyone.
    fireEvent.click(screen.getByText('Advanced'));
    screen.getByTestId('unilateral-exit-bump-fee').click();
    expect(onRebuild).toHaveBeenCalled();
  });

  it('drops the fee bump once the chain has diverged, since a rebuild is already offered', () => {
    renderTracker(plan([tx({ txid: 'a' })], { phase: 'redo' }));
    expect(screen.queryByTestId('unilateral-exit-bump-fee')).not.toBeInTheDocument();
  });

  it('shows why the network refused a step, since nothing else will', () => {
    renderTracker(plan([tx({ txid: 'a' })], { refusals: { a: 'min relay fee not met, 0 < 110' } }));
    expect(screen.getByText('The network refused a step')).toBeInTheDocument();
    expect(screen.getByTestId('unilateral-exit-refusal')).toHaveTextContent('min relay fee not met');
  });

  it('drops the refusal once the exit is being rebuilt anyway', () => {
    renderTracker(plan([tx({ txid: 'a' })], { phase: 'redo', refusals: { a: 'txn-mempool-conflict' } }));
    expect(screen.queryByText('The network refused a step')).not.toBeInTheDocument();
  });

  it('says so when it cannot reach the chain to check on the exit', () => {
    renderTracker(plan([tx({ txid: 'a' })], { lastCheckError: 'esplora down' }));
    expect(screen.getByText('Cannot read the exit right now')).toBeInTheDocument();
  });

  it('keeps an off-device copy reachable, since only this device holds what an exit needs', () => {
    renderTracker(plan([tx({ txid: 'a' })]));
    expect(screen.queryByTestId('unilateral-exit-backup-save')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Advanced'));
    expect(screen.getByText('Save exit data')).toBeInTheDocument();
    expect(screen.getByTestId('unilateral-exit-backup-save')).toBeInTheDocument();
  });
});
