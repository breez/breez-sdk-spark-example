import React, { useEffect, useState } from 'react';
import { PrimaryButton } from '../../../components/ui';

export interface InputStepProps {
  paymentInput: string;
  isLoading: boolean;
  error: string | null;
  onContinue: (paymentInput: string) => void;
}

const InputStep: React.FC<InputStepProps> = ({ paymentInput, isLoading, error, onContinue }) => {
  const [localPaymentInput, setLocalPaymentInput] = useState<string>(paymentInput || '');

  // keep local input in sync when parent-provided amount changes (e.g., prefilled)
  useEffect(() => {
    setLocalPaymentInput(paymentInput || '');
  }, [paymentInput]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[rgb(var(--text-white))]">
          Payment Destination
        </label>
        <textarea
          value={localPaymentInput}
          onChange={(e) => setLocalPaymentInput(e.target.value)}
          placeholder="Invoice | Lightning Address | BTC Address | LNURL"
          className="w-full p-3 border border-[rgb(var(--card-border))] rounded-lg bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] placeholder-[rgb(var(--text-white))] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-blue))] resize-none"
          rows={3}
          disabled={isLoading}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <PrimaryButton
          onClick={() => onContinue(localPaymentInput)}
          disabled={isLoading || !localPaymentInput.trim()}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default InputStep;
