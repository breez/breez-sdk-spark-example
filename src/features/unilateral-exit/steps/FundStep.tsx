import React from 'react';
import { CopyableText, PrimaryButton, QRCodeContainer, SecondaryButton } from '@/components/ui';
import { AlertCard } from '@/components/AlertCard';
import { SatAmount } from '@/components/SatAmount';
import { CheckCircleIcon } from '@/components/Icons';
import type { FundingFields } from '../hooks/useUnilateralExitFlow';

export const FundStep: React.FC<FundingFields & { onBack: () => void; onContinue: () => void }> = ({
  address,
  requiredSat,
  fundedSat,
  isFunded,
  hasPendingDeposit,
  isResuming,
  onBack,
  onContinue,
}) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="font-display font-semibold text-spark-text-primary text-lg mb-2">
        Send Bitcoin for the fees
      </h2>
      <p className="text-spark-text-muted text-sm">
        {isResuming ? (
          <>
            This exit is part-way done, and what it has left is paid for by the{' '}
            <SatAmount sats={fundedSat} /> already at this address. Add more only if a step is
            later rejected for want of fees.
          </>
        ) : (
          <>
            Send at least <SatAmount sats={requiredSat} /> from any Bitcoin wallet to the address
            below. This pays the miners for every step of the exit.
          </>
        )}
      </p>
    </div>

    <div className="flex flex-col items-center gap-6">
      <QRCodeContainer value={address} />

      <CopyableText
        text={address}
        label="Funding address"
        truncate
        showShare
        data-testid="unilateral-exit-funding-address"
      />
    </div>

    <div className="bg-spark-dark border border-spark-border rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-spark-text-secondary text-sm">Received</span>
        <span className="font-mono text-sm text-spark-text-primary">
          <SatAmount sats={fundedSat} />
        </span>
      </div>
      {!isResuming && (
        <div className="flex items-center justify-between">
          <span className="text-spark-text-secondary text-sm">Needed</span>
          <span className="font-mono text-sm text-spark-text-primary">
            <SatAmount sats={requiredSat} />
          </span>
        </div>
      )}
    </div>

    {isFunded ? (
      <div className="flex items-center gap-3 p-4 rounded-xl border bg-spark-success/10 border-spark-success/30">
        <CheckCircleIcon className="shrink-0 text-spark-success" />
        <p className="text-sm text-spark-success">Funding confirmed. You can build the exit.</p>
      </div>
    ) : (
      <AlertCard variant="warning" title={hasPendingDeposit ? 'Waiting for a confirmation' : 'Waiting for your deposit'}>
        <p className="text-sm">
          {hasPendingDeposit
            ? 'Your deposit is in the mempool. It has to confirm before the exit can be built.'
            : 'This page watches the address and continues on its own once the coins arrive and confirm.'}
        </p>
      </AlertCard>
    )}

    <AlertCard variant="info" title="This address belongs to your wallet">
      <p className="text-sm">
        It comes from your recovery phrase, so anything left over stays yours and can be swept from
        any wallet restored with that phrase.
      </p>
    </AlertCard>

    <div className="flex gap-3">
      <SecondaryButton onClick={onBack} className="flex-1">
        Back
      </SecondaryButton>
      <PrimaryButton
        onClick={onContinue}
        disabled={!isFunded}
        className="flex-1"
        data-testid="unilateral-exit-fund-continue"
      >
        Continue
      </PrimaryButton>
    </div>
  </div>
);
