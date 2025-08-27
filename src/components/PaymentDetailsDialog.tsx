import React, { useState } from 'react';
import type { Payment } from '@breeztech/breez-sdk-spark/web';
import {
  DialogHeader, PaymentInfoCard, PaymentInfoRow,
  CollapsibleCodeField, BottomSheetContainer, BottomSheetCard
} from './ui';

interface PaymentDetailsDialogProps {
  optionalPayment: Payment | null;
  onClose: () => void;
}

const PaymentDetailsDialog: React.FC<PaymentDetailsDialogProps> = ({ optionalPayment, onClose }) => {
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    invoice: false,
    preimage: false,
    destinationPubkey: false,
    txId: false,
    swapId: false,
    assetId: false,
    destination: false
  });

  // Format date and time
  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleField = (field: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!optionalPayment) return (
    <BottomSheetContainer isOpen={optionalPayment != null} onClose={onClose}>
      <BottomSheetCard className="bottom-sheet-card">{
        <div></div>}</BottomSheetCard>
    </BottomSheetContainer>

  );
  const payment = optionalPayment!;
  return (
    <BottomSheetContainer isOpen={optionalPayment != null} onClose={onClose}>
      <BottomSheetCard className="bottom-sheet-card">
        <DialogHeader title="Payment Details" onClose={onClose} />
        <div className="space-y-4 overflow-y-auto">
          {/* General Payment Information */}
          <PaymentInfoCard>
            <PaymentInfoRow
              label="Amount"
              value={`${payment.paymentType === 'receive' ? '+' : '-'} ${payment.amount.toLocaleString()} sats`}
            />

            <PaymentInfoRow
              label="Fee"
              value={`${payment.fees.toLocaleString()} sats`}
            />

            <PaymentInfoRow
              label="Date & Time"
              value={formatDateTime(payment.timestamp)}
            />

            {payment.details?.type === 'lightning' && payment.details.invoice && (
              <CollapsibleCodeField
                label="Invoice"
                value={payment.details.invoice}
                isVisible={visibleFields.invoice}
                onToggle={() => toggleField('invoice')}
              />
            )}

            {payment.details?.type === 'lightning' && payment.details.preimage && (
              <CollapsibleCodeField
                label="Payment Preimage"
                value={payment.details.preimage}
                isVisible={visibleFields.preimage}
                onToggle={() => toggleField('preimage')}
              />
            )}

            {payment.details?.type === 'lightning' && payment.details.destinationPubkey && (
              <CollapsibleCodeField
                label="Destination Public Key"
                value={payment.details.destinationPubkey}
                isVisible={visibleFields.destinationPubkey}
                onToggle={() => toggleField('destinationPubkey')}
              />
            )}
            {payment.details?.type === 'deposit' && payment.details.txId && (
              <div className="mt-4">
                <CollapsibleCodeField
                  label="Transaction ID"
                  value={payment.details.txId}
                  isVisible={visibleFields.txId}
                  onToggle={() => toggleField('txId')}
                />
              </div>
            )}
            {payment.details?.type === 'withdraw' && payment.details.txId && (
              <div className="mt-4">
                <CollapsibleCodeField
                  label="Transaction ID"
                  value={payment.details.txId}
                  isVisible={visibleFields.txId}
                  onToggle={() => toggleField('txId')}
                />
              </div>
            )}

          </PaymentInfoCard>
        </div>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default PaymentDetailsDialog;
