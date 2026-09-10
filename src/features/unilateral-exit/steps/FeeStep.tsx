import React from 'react';
import { LoadingSpinner } from '@/components/ui';
import { RadioCheckIcon } from '@/components/Icons';
import type { FeeChoice, FeeFields } from '../hooks/useUnilateralExitFlow';

const choices: { key: FeeChoice; label: string }[] = [
  { key: 'slow', label: 'Slow' },
  { key: 'medium', label: 'Medium' },
  { key: 'fast', label: 'Fast' },
];

export const FeeStep: React.FC<FeeFields> = ({ feeRates, feeChoice, onSelect }) => {
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
        <span className="block text-sm font-medium text-spark-text-primary mb-2">
          Select Fee Rate
        </span>
        <div className="flex gap-2">
          {choices.map(choice => (
            <button
              key={choice.key}
              type="button"
              onClick={() => onSelect(choice.key)}
              className={`relative flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                feeChoice === choice.key
                  ? 'bg-spark-primary/15 text-spark-text-primary border-spark-primary ring-2 ring-spark-primary'
                  : 'bg-spark-dark text-spark-text-secondary border-spark-border-light hover:border-spark-primary'
              }`}
            >
              {feeChoice === choice.key && <RadioCheckIcon className="absolute top-2 right-2" />}
              <div>{choice.label}</div>
              <div className="text-xs opacity-70">{feeRates[choice.key]} sat/vB</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
