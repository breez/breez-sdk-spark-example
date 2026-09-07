import React from 'react';
import type { PrepareUnilateralExitResponse } from '@breeztech/breez-sdk-spark';
import { ErrorMessageBox, PrimaryButton, SecondaryButton } from '@/components/ui';
import { AlertCard } from '@/components/AlertCard';
import { FeeBreakdownCard } from '@/components/FeeBreakdownCard';
import { SatAmount } from '@/components/SatAmount';
import { formatWithSpaces } from '@/utils/formatNumber';

export const ConfirmStep: React.FC<{
  quote: PrepareUnilateralExitResponse;
  sweepFeeSat: number;
  willReceiveSat: number;
  fundedSat: number;
  error: string | null;
  onBack: () => void;
  onBuild: () => void;
}> = ({ quote, sweepFeeSat, willReceiveSat, fundedSat, error, onBack, onBuild }) => (
  <div className="space-y-6">
    <FeeBreakdownCard
      items={[
        { label: 'Your balance', value: quote.recoverableValueSat },
        { label: 'Taken from your balance', value: `\u2212${formatWithSpaces(sweepFeeSat)}` },
        { label: 'You receive, about', value: willReceiveSat, highlight: true },
      ]}
    />

    <p className="text-spark-text-muted text-xs -mt-4">
      The <SatAmount sats={fundedSat} /> you funded pays the other mining fees. Treat it as
      spent: it is not part of what reaches your address.
    </p>

    <div className="bg-spark-dark border border-spark-border rounded-2xl p-4 space-y-2">
      <span className="text-spark-text-secondary text-sm">Destination</span>
      <code className="block text-spark-text-primary font-mono text-xs break-all">
        {quote.destination}
      </code>
    </div>

    <AlertCard variant="warning" title="This takes days, sometimes weeks">
      <p className="text-sm">
        Each step waits for the one before it to confirm, and some wait out a timelock on top of
        that. Open Glow now and then and it keeps going on its own. Nothing is lost if you close it.
      </p>
    </AlertCard>

    {error && <ErrorMessageBox title="Could not build the exit" error={error} />}

    <div className="flex gap-3">
      <SecondaryButton onClick={onBack} className="flex-1">
        Back
      </SecondaryButton>
      <PrimaryButton onClick={onBuild} className="flex-1" data-testid="unilateral-exit-build">
        Exit Spark
      </PrimaryButton>
    </div>
  </div>
);
