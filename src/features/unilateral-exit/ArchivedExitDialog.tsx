import React, { useState } from 'react';
import {
  BottomSheetCard,
  BottomSheetContainer,
  CollapsibleCodeField,
  DialogHeader,
  PaymentInfoCard,
  PaymentInfoRow,
} from '@/components/ui';
import { SatAmount } from '@/components/SatAmount';
import { explorerTxUrl } from '@/utils/explorer';
import type { ArchivedExit } from './archive';

/**
 * A finished exit's details, laid out the way PaymentDetailsDialog shows a
 * withdrawal: it lists as a BTC Transfer, so it opens like one.
 */
export const ArchivedExitDialog: React.FC<{ exit: ArchivedExit; onClose: () => void }> = ({
  exit,
  onClose,
}) => {
  const [shown, setShown] = useState({ destination: false, txid: false });
  const toggle = (field: keyof typeof shown) => setShown(current => ({ ...current, [field]: !current[field] }));

  return (
    <BottomSheetContainer isOpen onClose={onClose}>
      <BottomSheetCard>
        <DialogHeader title="BTC Transfer" onClose={onClose} />
        <div className="space-y-4 overflow-y-auto" data-testid="unilateral-exit-details">
          <PaymentInfoCard>
            <PaymentInfoRow label="Amount" value={<>- <SatAmount sats={exit.deliveredSat} /></>} />
            <PaymentInfoRow
              label="Date & Time"
              value={new Date(exit.completedAt).toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
          </PaymentInfoCard>

          <CollapsibleCodeField
            label="Recipient Address"
            value={exit.destination}
            isVisible={shown.destination}
            onToggle={() => toggle('destination')}
          />
          {/* The sweep: the transaction that delivered the money. */}
          <CollapsibleCodeField
            label="Transaction ID"
            value={exit.id}
            isVisible={shown.txid}
            onToggle={() => toggle('txid')}
            href={explorerTxUrl(exit.id)}
          />
        </div>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};
