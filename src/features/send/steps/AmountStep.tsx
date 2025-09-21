import React from 'react';
import { FormGroup, FormError, PrimaryButton, FormDescription } from '../../../components/ui';
import LoadingSpinner from '../../../components/LoadingSpinner';
import type { FeeOptions } from '../../../types/domain';

export interface AmountStepProps {
  paymentMethod: string;
  paymentInput: string;
  amount: string;
  setAmount: (value: string) => void;
  selectedFeeRate: 'fast' | 'medium' | 'slow' | null;
  setSelectedFeeRate: (rate: 'fast' | 'medium' | 'slow') => void;
  feeOptions: FeeOptions | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
}

const AmountStep: React.FC<AmountStepProps> = ({
  paymentMethod,
  paymentInput,
  amount,
  setAmount,
  selectedFeeRate,
  setSelectedFeeRate,
  feeOptions,
  isLoading,
  error,
  onBack,
  onNext,
}) => {
  const needsFeeSelection = paymentMethod === 'Bitcoin Address' && !!feeOptions;

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

      {/* Fee selection for Bitcoin addresses */}
      {needsFeeSelection && feeOptions && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-white))] mb-2">Fee Rate</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedFeeRate('slow')}
              disabled={isLoading}
              className={`relative p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedFeeRate === 'slow'
                  ? 'bg-[rgb(var(--primary-blue))] text-white border-[rgb(var(--primary-blue))] ring-2 ring-[rgb(var(--primary-blue))]'
                  : 'bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] border-[rgb(var(--card-border))] hover:border-[rgb(var(--primary-blue))]'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedFeeRate === 'slow' && (
                <svg className="absolute top-2 right-2 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <div>Slow</div>
              <div className="text-xs opacity-70">{feeOptions.slow} sats</div>
            </button>
            <button
              onClick={() => setSelectedFeeRate('medium')}
              disabled={isLoading}
              className={`relative p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedFeeRate === 'medium'
                  ? 'bg-[rgb(var(--primary-blue))] text-white border-[rgb(var(--primary-blue))] ring-2 ring-[rgb(var(--primary-blue))]'
                  : 'bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] border-[rgb(var(--card-border))] hover:border-[rgb(var(--primary-blue))]'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedFeeRate === 'medium' && (
                <svg className="absolute top-2 right-2 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <div>Medium</div>
              <div className="text-xs opacity-70">{feeOptions.medium} sats</div>
            </button>
            <button
              onClick={() => setSelectedFeeRate('fast')}
              disabled={isLoading}
              className={`relative p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedFeeRate === 'fast'
                  ? 'bg-[rgb(var(--primary-blue))] text-white border-[rgb(var(--primary-blue))] ring-2 ring-[rgb(var(--primary-blue))]'
                  : 'bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] border-[rgb(var(--card-border))] hover:border-[rgb(var(--primary-blue))]'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedFeeRate === 'fast' && (
                <svg className="absolute top-2 right-2 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <div>Fast</div>
              <div className="text-xs opacity-70">{feeOptions.fast} sats</div>
            </button>
          </div>
        </div>
      )}

      <FormError error={error} />

      <div className="flex gap-3 mt-6">
        <PrimaryButton onClick={onBack} disabled={isLoading} className="flex-1 bg-gray-600 hover:bg-gray-700">
          Back
        </PrimaryButton>
        <PrimaryButton
          onClick={onNext}
          disabled={
            isLoading ||
            !amount ||
            parseInt(amount) <= 0 ||
            Boolean(needsFeeSelection && !selectedFeeRate)
          }
          className="flex-1"
        >
          {isLoading ? <LoadingSpinner text="Processing..." size="small" /> : 'Continue'}
        </PrimaryButton>
      </div>
    </FormGroup>
  );
};

export default AmountStep;
