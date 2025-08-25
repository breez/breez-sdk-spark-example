import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { PrimaryButton } from '../components/ui';

interface RestorePageProps {
  onConnect: (mnemonic: string) => void;
  onBack: () => void;
  onClearError: () => void;
}

const RestorePage: React.FC<RestorePageProps> = ({
  onConnect,
  onBack,
  onClearError
}) => {
  const [mnemonic, setMnemonic] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const cleaned = mnemonic.trim().replace(/\s+/g, ' ');
    const wordCount = cleaned.split(' ').length;

    if (wordCount !== 12 && wordCount !== 24) {
      setError('Please enter a valid 12 or 24-word recovery phrase');
      return;
    }

    setError(null);
    onConnect(cleaned);
  };

  const footer = (
    <div className="flex w-full p-4 max-w-1xl items-center">
      <PrimaryButton
        onClick={handleSubmit}
        disabled={!mnemonic.trim()}
        className="ml-auto"
      >
        Restore Wallet
      </PrimaryButton>
    </div>
  )

  return (
    <PageLayout footer={footer} onBack={onBack} title="Restore Wallet" onClearError={onClearError}>
      <div className="flex flex-col container h-full mx-auto max-w-md px-4">
        <p className="text-[rgb(var(--text-white))] opacity-80 mb-4">
          Please enter your 12 or 24-word recovery phrase, with words separated by spaces.
        </p>

        <textarea
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          className="w-full h-32 px-3 py-2 text-[rgb(var(--text-white))] bg-[rgb(var(--card-border))] border border-[rgb(var(--card-border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--secondary-blue)] mb-4"
          placeholder="Enter your recovery phrase..."
        />

        {error && (
          <div className="text-[rgb(var(--accent-red))] mb-4">
            {error}
          </div>
        )}

        <div className="flex-1"></div>
      </div>
    </PageLayout>
  );
};

export default RestorePage;
