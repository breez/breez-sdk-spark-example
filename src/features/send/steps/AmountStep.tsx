import React from 'react';
import { FormGroup, FormError, PrimaryButton, FormDescription } from '../../../components/ui';
import LoadingSpinner from '../../../components/LoadingSpinner';

export interface AmountStepProps {
  paymentInput: string;
  amount: string;
  setAmount: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
}

const AmountStep: React.FC<AmountStepProps> = ({
  paymentInput,
  amount,
  setAmount,
  isLoading,
  error,
  onBack,
  onNext,
}) => {
  return (
    <FormGroup>
      <div className="text-center mb-6">
        <FormDescription>Enter the amount you want to send</FormDescription>
      </div>

      {/* Show the payment destination */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[rgb(var(--text-white))] mb-2">Payment Destination</label>
        <div className="p-3 bg-[rgb(var(--card-border))] rounded-lg">
          <code className="text-sm text-[rgb(var(--text-white))] break-all">{paymentInput}</code>
        </div>
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[rgb(var(--text-white))] mb-2">Amount (sats)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount in satoshis"
          className="w-full p-3 border border-[rgb(var(--card-border))] rounded-lg bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] placeholder-[rgb(var(--text-white))] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-blue))]"
          disabled={isLoading}
          min={1}
        />
      </div>

      {/* Fee selection removed from generic AmountStep; handled in workflow-specific steps */}

      <FormError error={error} />

      <div className="flex gap-3 mt-6">
        <PrimaryButton onClick={onBack} disabled={isLoading} className="flex-1 bg-gray-600 hover:bg-gray-700">
          Back
        </PrimaryButton>
        <PrimaryButton
          onClick={onNext}
          disabled={isLoading || !amount || parseInt(amount) <= 0}
          className="flex-1"
        >
          {isLoading ? <LoadingSpinner text="Processing..." size="small" /> : 'Continue'}
        </PrimaryButton>
      </div>
    </FormGroup>
  );
};

export default AmountStep;
