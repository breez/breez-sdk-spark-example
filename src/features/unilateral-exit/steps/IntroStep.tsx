import React, { useState } from 'react';
import { CollapsibleSection, PrimaryButton } from '@/components/ui';
import { SimpleAlert } from '@/components/AlertCard';
import { BackupActions } from '../BackupCard';

const requirements = [
  'Pay exit fees using another on-chain wallet',
  'A bitcoin destination address for the receiving funds',
  'Days of waiting for the process to complete due to on-chain timelocks',
];

export const IntroStep: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      <SimpleAlert variant="warning" hideIcon>
        Move your balance on-chain without Spark operators. Use this only if Spark stops
        operating. This is a last-resort action.
      </SimpleAlert>

      <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
        <h3 className="font-display font-semibold text-spark-text-primary text-sm mb-3">
          What you need
        </h3>
        <ul className="space-y-3">
          {requirements.map(item => (
            <li key={item} className="text-spark-text-secondary text-sm flex gap-3">
              <span className="text-spark-primary shrink-0">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <CollapsibleSection
        label="Advanced"
        isVisible={advanced}
        onToggle={() => setAdvanced(v => !v)}
      >
        <BackupActions />
      </CollapsibleSection>

      <PrimaryButton onClick={onContinue} className="w-full" data-testid="unilateral-exit-start">
        Continue
      </PrimaryButton>
    </div>
  );
};
