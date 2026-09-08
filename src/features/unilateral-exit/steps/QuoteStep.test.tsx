import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { PrepareUnilateralExitResponse } from '@breeztech/breez-sdk-spark';
import { QuoteStep } from './QuoteStep';

const quote = (over: Partial<PrepareUnilateralExitResponse> = {}): PrepareUnilateralExitResponse => ({
  leaves: [{ leafId: 'leaf-1', value: 100_000 }],
  recoverableValueSat: 100_000,
  totalFeeSat: 4_000,
  cpfpFeeSat: 3_800,
  fanoutFeeSat: 0,
  sweepFeeSat: 200,
  singleUtxoFundingSat: 6_000,
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

const renderStep = (props: Partial<React.ComponentProps<typeof QuoteStep>> = {}) =>
  render(
    <QuoteStep
      quote={quote()}
      sweepFeeSat={200}
      willReceiveSat={99_800}
      isQuoting={false}
      error={null}
      leftBehindSat={0}
      onBack={vi.fn()}
      onContinue={vi.fn()}
      {...props}
    />,
  );

describe('QuoteStep', () => {
  it('shows the one fee that comes off the balance, so the shortfall is not a surprise', () => {
    renderStep();
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Sweep fee')).toBeInTheDocument();
    // The label already says it is a cost, so the figure is a plain amount.
    const row = screen.getByText('Sweep fee').parentElement as HTMLElement;
    expect(within(row).getByText(/200/)).toBeInTheDocument();
  });

  it('says what the exit fee pays for, and that it does not come back', () => {
    renderStep();
    expect(screen.getByText('Exit fee')).toBeInTheDocument();
    expect(screen.getByText(/mining fees required to move the Spark tree/)).toBeInTheDocument();
  });

  it('estimates what arrives as the balance less the sweep fee, funding excluded', () => {
    renderStep();
    expect(screen.getByText(/You.ll receive/)).toBeInTheDocument();
    expect(screen.getByText(/99 800/)).toBeInTheDocument();
  });

  it('says how much Bitcoin the user has to supply', () => {
    renderStep();
    const row = screen.getByText('Exit fee').parentElement as HTMLElement;
    expect(within(row).getByText(/6 000/)).toBeInTheDocument();
  });

  it('lets a worthwhile exit continue', () => {
    renderStep();
    expect(screen.getByText('Continue')).toBeEnabled();
  });

  it('will not let an exit start when the fees would eat it', () => {
    renderStep({
      quote: quote({ recoverableValueSat: 1_000, totalFeeSat: 4_000 }),
      sweepFeeSat: 200,
      willReceiveSat: 800,
    });
    expect(screen.getByText('Nothing is worth exiting right now')).toBeInTheDocument();
    expect(screen.queryByText('Continue')).not.toBeInTheDocument();
  });

  it('distinguishes having no leaves at all from the fees being too high', () => {
    renderStep({ quote: quote({ leaves: [], recoverableValueSat: 0 }) });
    expect(screen.getByText('Nothing here to exit')).toBeInTheDocument();
    expect(screen.queryByText('Nothing is worth exiting right now')).not.toBeInTheDocument();
    expect(screen.queryByText('Change fee rate')).not.toBeInTheDocument();
  });

  it('names the balance being left behind as dust', () => {
    renderStep({ leftBehindSat: 2_500 });
    expect(screen.getByText('Some of your balance stays behind')).toBeInTheDocument();
    expect(screen.getByText(/2 500/)).toBeInTheDocument();
  });

  it('reports a quote that failed outright', () => {
    renderStep({ error: 'operators unreachable' });
    expect(screen.getByText('Could not quote the exit')).toBeInTheDocument();
  });
});
