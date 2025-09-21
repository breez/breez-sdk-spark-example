import React from 'react';
import {
  FormGroup,
  PaymentInfoCard,
  PaymentInfoRow,
  PaymentInfoDivider,
  PrimaryButton,
  FormError,
  FormDescription,
} from '../../../components/ui';
import LoadingSpinner from '../../../components/LoadingSpinner';

export interface ConfirmStepProps {
  amountSats: number | null;
  feesSat: number | null;
  error: string | null;
  isLoading: boolean;
  onBack?: () => void;
  onConfirm: () => void;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({ amountSats, feesSat, error, isLoading, onConfirm }) => {
  return (
    <FormGroup>
      <center className="m-6">
        <FormDescription>You are requested to pay</FormDescription>
        <div className="mt-2 text-2xl font-bold text-[rgb(var(--text-white))]">
          {(((amountSats || 0) + (feesSat || 0)) as number).toLocaleString()} sats
        </div>
      </center>
      <PaymentInfoCard>
        <PaymentInfoRow label="Amount" value={`${amountSats?.toLocaleString() || '0'} sats`} />
        <PaymentInfoRow label="Fee" value={`${feesSat?.toLocaleString() || '0'} sats`} />
        <PaymentInfoDivider />
      </PaymentInfoCard>

      <FormError error={error} />

      <div className="mt-6 flex justify-center">
        <PrimaryButton onClick={onConfirm} disabled={isLoading}>
          {isLoading ? <LoadingSpinner text="Processing..." size="small" /> : 'Pay'}
        </PrimaryButton>
      </div>
    </FormGroup>
  );
};

export default ConfirmStep;
