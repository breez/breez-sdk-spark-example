import React from 'react';
import { FormInput, PrimaryButton, SecondaryButton, LoadingSpinner } from '@/components/ui';
import { RadioCheckIcon } from '@/components/Icons';
import type { FeeChoice, FeeFields } from '../hooks/useUnilateralExitFlow';

const choices: { key: Exclude<FeeChoice, 'custom'>; label: string }[] = [
  { key: 'slow', label: 'Slow' },
  { key: 'medium', label: 'Medium' },
  { key: 'fast', label: 'Fast' },
];

export const FeeStep: React.FC<FeeFields & { onBack: () => void; onContinue: () => void }> = ({
  feeRates,
  feeChoice,
  customFeeRate,
  effectiveFeeRate,
  onSelect,
  onCustomChange,
  onBack,
  onContinue,
}) => {
  if (!feeRates) {
    return (
      <div className="py-16 flex justify-center">
        <LoadingSpinner text="Reading current fee rates..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="block text-sm font-medium text-spark-text-secondary mb-2">
          Fee rate
        </span>
        <div className="grid grid-cols-3 gap-2">
          {choices.map(choice => (
            <button
              key={choice.key}
              type="button"
              onClick={() => onSelect(choice.key)}
              className={`relative p-3 rounded-lg border text-sm font-medium transition-colors ${
                feeChoice === choice.key
                  ? 'bg-spark-primary/15 text-spark-text-primary border-spark-primary ring-2 ring-spark-primary'
                  : 'bg-spark-dark text-spark-text-secondary border-spark-border hover:border-spark-primary'
              }`}
            >
              {feeChoice === choice.key && <RadioCheckIcon className="absolute top-2 right-2" />}
              <div>{choice.label}</div>
              <div className="text-xs opacity-70">{feeRates[choice.key]} sat/vB</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => onSelect('custom')}
          className={`text-sm font-medium transition-colors ${
            feeChoice === 'custom' ? 'text-spark-primary' : 'text-spark-text-muted hover:text-spark-text-secondary'
          }`}
        >
          Set a custom rate
        </button>
        {feeChoice === 'custom' && (
          <div className="mt-2">
            <FormInput
              id="unilateral-exit-custom-fee"
              type="number"
              value={customFeeRate}
              onChange={event => onCustomChange(event.target.value)}
              placeholder="sat/vB"
            />
          </div>
        )}
      </div>

      <p className="text-spark-text-muted text-xs">
        A higher rate costs more but confirms each of the many steps sooner. A lower rate leaves
        more of your balance worth exiting.
      </p>

      <div className="flex gap-3">
        <SecondaryButton onClick={onBack} className="flex-1">
          Back
        </SecondaryButton>
        <PrimaryButton
          onClick={onContinue}
          disabled={effectiveFeeRate <= 0}
          className="flex-1"
          data-testid="unilateral-exit-get-quote"
        >
          Get quote
        </PrimaryButton>
      </div>
    </div>
  );
};
