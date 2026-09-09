import React from 'react';
import { FormInput } from '@/components/ui';
import { SimpleAlert } from '@/components/AlertCard';
import type { DestinationFields } from '../hooks/useUnilateralExitFlow';

export const DestinationStep: React.FC<DestinationFields> = ({ destination, onChange, error }) => (
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
    </div>

    {error && <SimpleAlert variant="error">{error}</SimpleAlert>}

  </div>
);
