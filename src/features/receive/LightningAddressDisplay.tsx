import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { QRCodeContainer, PrimaryButton, FormGroup, FormInput, FormError } from '../../components/ui';

export interface LightningAddressDisplayProps {
  address: string | null;
  isLoading: boolean;
  isEditing: boolean;
  editValue: string;
  error: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditValueChange: (value: string) => void;
  onCustomizeAmount: () => void;
}

const EditableAddressText: React.FC<{
  text: string;
  onEdit: () => void;
}> = ({ text, onEdit }) => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={text}
        readOnly
        className="w-full px-3 py-2 pr-12 bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))] rounded text-center"
      />
      <button
        onClick={onEdit}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-[rgb(var(--text-white))] hover:text-[var(--primary-blue)] transition-colors"
        title="Edit Lightning Address"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  );
};

const LightningAddressDisplay: React.FC<LightningAddressDisplayProps> = ({
  address,
  isLoading,
  isEditing,
  editValue,
  error,
  onEdit,
  onSave,
  onCancel,
  onEditValueChange,
  onCustomizeAmount,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner text="Loading Lightning Address..." />
      </div>
    );
  }

  if (!address && !isEditing) {
    return (
      <div className="pt-4 space-y-6 flex flex-col items-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">Lightning Address</h3>
          <p className="text-[rgb(var(--text-white))] opacity-75 text-sm mb-4">
            Create a Lightning Address to receive payments easily
          </p>
          <PrimaryButton onClick={onEdit}>Create Lightning Address</PrimaryButton>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="pt-4 space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">
            {address ? 'Edit Lightning Address' : 'Create Lightning Address'}
          </h3>
        </div>

        <FormGroup>
          <FormInput
            id="lightning-address"
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            placeholder="username"
            disabled={isLoading}
          />
          <FormError error={error} />
        </FormGroup>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[rgb(var(--text-white))] border border-[rgb(var(--text-white))] rounded-lg hover:bg-[rgb(var(--text-white))] hover:text-[rgb(var(--bg-primary))] transition-colors"
          >
            Cancel
          </button>
          <PrimaryButton onClick={onSave} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="small" /> : 'Save'}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-6 flex flex-col items-center">
      <div className="text-center">
        <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">Lightning Address</h3>
        <p className="text-[rgb(var(--text-white))] opacity-75 text-sm">
          Share this address to receive Lightning payments
        </p>
      </div>

      <QRCodeContainer value={address || ''} />

      <div className="w-full space-y-4">
        <EditableAddressText text={address || ''} onEdit={onEdit} />

        <div className="flex justify-center">
          <PrimaryButton onClick={onCustomizeAmount}>Customize Amount</PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default LightningAddressDisplay;
