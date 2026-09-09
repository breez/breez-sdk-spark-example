import React from 'react';
import { CopyableRow, ErrorMessageBox, QRCodeContainer } from '@/components/ui';
import { SatAmount } from '@/components/SatAmount';
import { CheckIcon, ClockIcon } from '@/components/Icons';
import { truncateAddress } from '@/utils/crossChainFormat';
import type { FundingFields } from '../hooks/useUnilateralExitFlow';

export const FundStep: React.FC<FundingFields & { error: string | null }> = ({
  address,
  requiredSat,
  fundedSat,
  isFunded,
  hasPendingDeposit,
  isResuming,
  error,
}) => {
  // BIP21 so the paying wallet fills the amount in as well as the address:
  // this is money sent from somewhere else, and the figure has to be exact.
  const btc = (requiredSat / 100_000_000).toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
  const qrValue = isResuming ? address : `bitcoin:${address}?amount=${btc}`;

  return (
  <div className="space-y-6">
    <div className="text-center py-4">
      <p className="text-spark-text-muted text-sm mb-2">Pay exit fee</p>
      <SatAmount
        sats={isResuming ? fundedSat : requiredSat}
        className="text-4xl font-bold text-spark-text-primary"
      />
    </div>

    <div className="flex justify-center">
      <QRCodeContainer value={qrValue} size={180} />
    </div>

    <CopyableRow
      label="To address"
      value={address}
      display={truncateAddress(address, 32)}
      data-testid="unilateral-exit-funding-address"
    />

    {/* One row either way, so the wait and the arrival read as the same line
        changing rather than two different screens. */}
    <div className="flex items-center gap-3 p-4 rounded-xl border border-spark-border">
      {isFunded ? (
        <CheckIcon className="shrink-0 text-spark-success" />
      ) : (
        <ClockIcon className="shrink-0 text-spark-primary" />
      )}
      <p className="text-sm text-spark-text-primary">
        {isFunded
          ? 'Exit fee received'
          : hasPendingDeposit
            ? 'Waiting for a confirmation'
            : 'Waiting for your deposit'}
      </p>
    </div>

    {error && <ErrorMessageBox title="Could not build the exit" error={error} />}

    {(isResuming || !isFunded) && (
      <p className="text-spark-text-muted text-xs">
        {isResuming ? (
          <>
            This exit is part-way done, and what it has left is paid for by the{' '}
            <SatAmount sats={fundedSat} /> already at this address. Add more only if a step is later
            rejected for want of fees.
          </>
        ) : (
          'To start the process you need to pay the exit fee. These are the mining fees required to move the Spark tree on-chain.'
        )}
      </p>
    )}

  </div>
  );
};
