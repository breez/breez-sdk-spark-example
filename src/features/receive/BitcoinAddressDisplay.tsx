import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { QRCodeContainer, CopyableText } from '../../components/ui';

interface Props {
  address: string | null;
  isLoading: boolean;
}

const BitcoinAddressDisplay: React.FC<Props> = ({ address, isLoading }) => {
  if (isLoading || !address) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner text="Generating Bitcoin address..." />
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-6 flex flex-col items-center">
      <div className="text-center">
        <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">Bitcoin Address</h3>
        <p className="text-[rgb(var(--text-white))] opacity-75 text-sm">
          Send Bitcoin to this address for automatic Lightning conversion
        </p>
      </div>

      <QRCodeContainer value={address} />

      <div className="w-full">
        <CopyableText text={address} />
      </div>
    </div>
  );
};

export default BitcoinAddressDisplay;
