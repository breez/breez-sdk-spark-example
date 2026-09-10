import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

describe('the status line while a check runs', () => {
  const advancing = () =>
    render(
      <TrackerView plan={twoLeaves([tx({ txid: 'r', kind: 'refund' })])} tipHeight={1000} isAdvancing onRebuild={vi.fn()} />,
    );

  it('says nothing about checking while the pass is quick', () => {
    vi.useFakeTimers();
    try {
      advancing();
      // A pass that returns this fast used to flip the line and flip it back.
      act(() => { vi.advanceTimersByTime(200); });
      expect(screen.getByTestId('unilateral-exit-status')).not.toHaveTextContent('Checking');
    } finally {
      vi.useRealTimers();
    }
  });

  it('explains itself once a pass is slow enough to notice', () => {
    vi.useFakeTimers();
    try {
      advancing();
      act(() => { vi.advanceTimersByTime(1_000); });
      expect(screen.getByTestId('unilateral-exit-status')).toHaveTextContent('Checking');
    } finally {
      vi.useRealTimers();
    }
  });
});

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

  it('offers a rebuild when fees went up and the exit fee address can still pay more', () => {
    const onRebuild = vi.fn();
    renderTracker(plan([tx({ txid: 'a' })], { refusals: { a: 'mempool min fee not met, 120 < 250' } }), 1000, onRebuild);
    expect(screen.getByText('Fees went up')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('unilateral-exit-refusal-rebuild'));
    expect(onRebuild).toHaveBeenCalled();
  });

  it('asks only for patience once the fee coins are fixed, since more money cannot help', () => {
    renderTracker(
      plan(
        [tx({ txid: 'f', kind: 'fanOut', status: confirmed(10) }), tx({ txid: 'a' })],
        { refusals: { a: 'mempool min fee not met, 120 < 250' } },
      ),
    );
    expect(screen.getByText('Fees went up')).toBeInTheDocument();
    expect(screen.queryByTestId('unilateral-exit-refusal-rebuild')).not.toBeInTheDocument();
  });

  it('says nothing about a step another copy already settled', () => {
    renderTracker(
      plan([tx({ txid: 'a', kind: 'refund' })], {
        refusals: { a: 'min relay fee not met, 0 < 13; bad-txns-inputs-missingorspent' },
      }),
    );
    expect(screen.queryByText('Fees went up')).not.toBeInTheDocument();
    expect(screen.queryByText('The network refused a step')).not.toBeInTheDocument();
  });

  it('shows any other refusal as the node gave it, since nothing else will', () => {
    renderTracker(plan([tx({ txid: 'a' })], { refusals: { a: 'non-BIP68-final' } }));
    expect(screen.getByText('The network refused a step')).toBeInTheDocument();
    expect(screen.getByTestId('unilateral-exit-refusal')).toHaveTextContent('non-BIP68-final');
  });

  it('drops the refusal once the exit is being rebuilt anyway', () => {
    renderTracker(plan([tx({ txid: 'a' })], { phase: 'redo', refusals: { a: 'non-BIP68-final' } }));
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
