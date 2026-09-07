import React from 'react';
import { PrimaryButton } from '@/components/ui';
import { AlertCard } from '@/components/AlertCard';
import { LifebuoyIcon } from '@/components/Icons';

const requirements = [
  'Bitcoin from another wallet, to pay the mining fees this takes',
  'An on-chain address you control, for the funds to land on',
  'Days of waiting: on-chain timelocks pace every step',
];

export const IntroStep: React.FC<{ onContinue: () => void }> = ({ onContinue }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-spark-primary/20 flex items-center justify-center mx-auto mb-4">
        <LifebuoyIcon size="xl" className="text-spark-primary" />
      </div>
      <h2 className="font-display font-semibold text-spark-text-primary text-lg mb-2">
        Unilateral exit
      </h2>
      <p className="text-spark-text-muted text-sm">
        This moves your balance to Bitcoin without help from the Spark operators. It exists for the
        case where they stop responding and a normal withdrawal is not possible.
      </p>
    </div>

    <AlertCard variant="warning" title="Use this only as a last resort">
      <p className="text-sm">
        A normal withdrawal is faster and much cheaper. Try that first if Spark is working.
      </p>
    </AlertCard>

    <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
      <h3 className="font-display font-semibold text-spark-text-primary text-sm mb-3">
        What you need
      </h3>
      <ul className="space-y-2">
        {requirements.map(item => (
          <li key={item} className="text-spark-text-secondary text-sm flex gap-2">
            <span className="text-spark-primary">-</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>

    <PrimaryButton onClick={onContinue} className="w-full" data-testid="unilateral-exit-start">
      Start unilateral exit
    </PrimaryButton>
  </div>
);
