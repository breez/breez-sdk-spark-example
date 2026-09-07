import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrackerView } from './TrackerView';
import type { UnilateralExitPlan } from './driver';
import { blocked, confirmed, locked, plan, tx } from './testFixtures';

// one input, one 596 524 sat output
const sweepHex =
  '0200000001' + '00'.repeat(32) + '00000000' + '00' + 'ffffffff' +
  '01' + '2c1a090000000000' + '160014' + 'ab'.repeat(20) + '00000000';

// one input, one 600 882 sat output: more than the balance, since the sweep
// also collected the funding's change.
const generousSweepHex =
  '0200000001' + '00'.repeat(32) + '00000000' + '00' + 'ffffffff' +
  '01' + '322b090000000000' + '160014' + 'ab'.repeat(20) + '00000000';

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
  render(<TrackerView plan={p} tipHeight={tipHeight} isAdvancing={false} onRebuild={onRebuild} onDone={vi.fn()} />);

describe('what the exit is worth right now', () => {
  it('shows the money in stages rather than a step count', () => {
    renderTracker(
      twoLeaves([
        tx({ txid: 'r1', kind: 'refund', nodeId: 'leaf-1', status: confirmed(900) }),
        tx({ txid: 'r2', kind: 'refund', nodeId: 'leaf-2', status: blocked }),
      ]),
    );
    const stages = screen.getByTestId('unilateral-exit-stages');
    expect(stages).toHaveTextContent('At your address');
    expect(stages).toHaveTextContent('180 000');
    expect(stages).toHaveTextContent('420 000');
  });

  it('leads with what will arrive: the balance less the sweep fee', () => {
    renderTracker(twoLeaves([tx({ txid: 'a' })]));
    expect(screen.getByText("You'll receive")).toBeInTheDocument();
    expect(screen.getByText(/599 785/)).toBeInTheDocument();
    expect(screen.getByText(/for the final sweep/)).toBeInTheDocument();
  });

  it('counts the steps done alongside the time left', () => {
    renderTracker(
      plan([tx({ txid: 'a', status: confirmed(900) }), tx({ txid: 'r', kind: 'refund', status: locked(3000) })]),
    );
    expect(screen.getByTestId('unilateral-exit-eta')).toHaveTextContent('1 of 2 steps done');
  });

  it('says how many steps the next wait releases', () => {
    renderTracker(
      plan([
        tx({ txid: 'r1', kind: 'refund', status: locked(1144) }),
        tx({ txid: 'r2', kind: 'refund', status: locked(1144) }),
        tx({ txid: 's', kind: 'sweep', status: locked(9000) }),
      ]),
    );
    expect(screen.getByText(/Next 2 steps/)).toBeInTheDocument();
  });

  it('estimates the whole wait, not just the next step', () => {
    renderTracker(
      plan([
        tx({ txid: 'a', status: confirmed(1000) }),
        tx({ txid: 'r', kind: 'refund', dependsOn: ['a'], csvTimelockBlocks: 2000, status: locked(3000) }),
      ]),
    );
    expect(screen.getByTestId('unilateral-exit-eta')).toHaveTextContent('about 14 d left');
  });

  it('says it is rebuilding rather than moving when the chain diverged', () => {
    renderTracker(plan([tx({ txid: 'a' })], { phase: 'redo' }));
    expect(screen.getByText('This exit needs rebuilding')).toBeInTheDocument();
  });
});

describe('once the exit is complete', () => {
  it('reports what the sweep actually paid out, and the fee as the gap to the balance', () => {
    renderTracker(
      twoLeaves([tx({ txid: 's', kind: 'sweep', txHex: sweepHex, status: confirmed(1000) })], { phase: 'complete' }),
    );
    expect(screen.getByText('Unilateral exit complete')).toBeInTheDocument();
    expect(screen.getAllByText(/596 524/).length).toBeGreaterThan(0);
    expect(screen.getByText('Mining fees')).toBeInTheDocument();
    // 600 000 - 596 524
    expect(screen.getByText(/3 476/)).toBeInTheDocument();
  });

  it('explains more arriving than the balance as funding coming back', () => {
    renderTracker(
      twoLeaves([tx({ txid: 's', kind: 'sweep', txHex: generousSweepHex, status: confirmed(3000) })], { phase: 'complete' }),
    );
    expect(screen.getByText('Unused funding returned')).toBeInTheDocument();
    expect(screen.getByText('882')).toBeInTheDocument();
    expect(screen.queryByText('Mining fees')).not.toBeInTheDocument();
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

  it('tells the user the exit survives closing the app', () => {
    renderTracker(plan([tx({ txid: 'a' })]));
    expect(screen.getByText(/You can close this/)).toBeInTheDocument();
  });

  it('urges an off-device copy, since only this device holds the signed set', () => {
    renderTracker(plan([tx({ txid: 'a' })]));
    expect(screen.getByText('Back these up')).toBeInTheDocument();
    expect(screen.getByText('Save a copy')).toBeInTheDocument();
  });
});
