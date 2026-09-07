import React from 'react';
import { FormInput, PrimaryButton, SecondaryButton } from '@/components/ui';
import { SimpleAlert } from '@/components/AlertCard';
import type { DestinationFields } from '../hooks/useUnilateralExitFlow';

export const DestinationStep: React.FC<
  DestinationFields & { onBack: () => void; onContinue: () => void }
> = ({ destination, onChange, error, onBack, onContinue }) => (
  <div className="space-y-6">
    <div>
      <label htmlFor="unilateral-exit-destination" className="block text-sm font-medium text-spark-text-secondary mb-2">
        Destination
      </label>
      <FormInput
        id="unilateral-exit-destination"
        type="text"
        value={destination}
        onChange={event => onChange(event.target.value)}
        placeholder="bc1q..."
      />
      <p className="text-spark-text-muted text-xs mt-2">
        Every exited sat is swept to this address. Use a wallet whose keys you hold, not an
        exchange deposit address.
      </p>
    </div>

    {error && <SimpleAlert variant="error">{error}</SimpleAlert>}

    <div className="flex gap-3">
      <SecondaryButton onClick={onBack} className="flex-1">
        Back
      </SecondaryButton>
      <PrimaryButton
        onClick={onContinue}
        disabled={!destination.trim()}
        className="flex-1"
        data-testid="unilateral-exit-destination-continue"
      >
        Continue
      </PrimaryButton>
    </div>
  </div>
);
