import React, { useState } from 'react';
import { CollapsibleSection } from '@/components/ui';
import { BackupActions } from '../BackupCard';

const requirements = [
  'Pay exit fees using another on-chain wallet',
  'A bitcoin destination address for the receiving funds',
  'Days of waiting for the process to complete due to on-chain timelocks',
];

export const IntroStep: React.FC = () => {
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
        <h3 className="font-display font-semibold text-spark-text-primary text-sm mb-3">
          What you need
        </h3>
        <ul className="space-y-3">
          {requirements.map(item => (
            <li key={item} className="text-spark-text-secondary text-sm flex gap-3">
              <span className="shrink-0">•</span>
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
    </div>
  );
};
