import { ErrorMessageBox, LoadingSpinner, PrimaryButton, SecondaryButton } from '@/components/ui';
import React from 'react';
import { AlertCard } from '@/components/AlertCard';
import { FeeBreakdownCard } from '@/components/FeeBreakdownCard';
import { formatWithSpaces } from '@/utils/formatNumber';
import { SatAmount } from '@/components/SatAmount';
import type { QuoteFields } from '../hooks/useUnilateralExitFlow';

export const QuoteStep: React.FC<QuoteFields & { onBack: () => void; onContinue: () => void }> = ({
  quote,
  sweepFeeSat,
  willReceiveSat,
  isQuoting,
  error,
  leftBehindSat,
  onBack,
  onContinue,
}) => {
  if (isQuoting) {
    return (
      <div className="py-16 flex justify-center">
        <LoadingSpinner text="Working out what can be exited..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorMessageBox title="Could not quote the exit" error={error} />
        <SecondaryButton onClick={onBack} className="w-full">
          Back
        </SecondaryButton>
      </div>
    );
  }

  if (!quote || quote.leaves.length === 0) {
    return (
      <div className="space-y-6">
        <AlertCard variant="warning" title="Nothing here to exit">
          <p className="text-sm">
            This wallet holds no funds on Spark that can be moved on-chain. If you were expecting
            some, the leaf data this needs may be missing from this device.
          </p>
        </AlertCard>
        <SecondaryButton onClick={onBack} className="w-full">
          Back
        </SecondaryButton>
      </div>
    );
  }

  if (quote.totalFeeSat >= quote.recoverableValueSat || willReceiveSat <= 0) {
    return (
      <div className="space-y-6">
        <AlertCard variant="warning" title="Nothing is worth exiting right now">
          <p className="text-sm">
            At this fee rate every part of your balance would cost more to move on-chain than it is
            worth. Try a lower fee rate, or wait for the network to get cheaper.
          </p>
        </AlertCard>
        <SecondaryButton onClick={onBack} className="w-full">
          Change fee rate
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeeBreakdownCard
        items={[
          { label: 'Your balance', value: quote.recoverableValueSat },
          { label: 'Taken from your balance', value: `\u2212${formatWithSpaces(sweepFeeSat)}` },
          { label: 'You receive, about', value: willReceiveSat, highlight: true },
        ]}
      />

      <div className="bg-spark-dark border border-spark-border rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-spark-text-secondary text-sm">Number of leaves</span>
          <span className="font-mono text-sm text-spark-text-primary">{quote.leaves.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-spark-text-secondary text-sm">Bitcoin to supply</span>
          <span className="font-mono text-sm text-spark-text-primary">
            <SatAmount sats={quote.singleUtxoFundingSat} />
          </span>
        </div>
        <p className="text-spark-text-muted text-xs">
          This pays the other mining fees, about{' '}
          <SatAmount sats={quote.cpfpFeeSat + quote.fanoutFeeSat} /> at this rate. Treat it as
          spent: it is not part of what reaches your address.
        </p>
      </div>

      {leftBehindSat > 0 && (
        <AlertCard variant="warning" title="Some of your balance stays behind">
          <p className="text-sm">
            <SatAmount sats={leftBehindSat} /> sits in pieces too small to be worth their own
            on-chain fee at this rate, so they are left out of this exit.
          </p>
        </AlertCard>
      )}

      <div className="flex gap-3">
        <SecondaryButton onClick={onBack} className="flex-1">
          Back
        </SecondaryButton>
        <PrimaryButton
          onClick={onContinue}
          className="flex-1"
          data-testid="unilateral-exit-quote-continue"
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
};
