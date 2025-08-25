import React from 'react';
import { PrimaryButton } from '../components/ui';

interface HomePageProps {
  onRestoreWallet: () => void;
  onCreateNewWallet: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onRestoreWallet, onCreateNewWallet }) => {
  return (
    <div className="h-[calc(100dvh)] bg-[var(--card-bg)] flex p-6 flex-col px-4 text-center items-center">
      {/* Logo/Header */}
      <div className="mb-0">
        <h1 className="text-4xl font-bold text-[rgb(var(--text-white))] mb-2">
          Lightning Wallet
        </h1>
        <p className="text-xl text-[rgb(var(--text-white))] opacity-80">
          Powered by Breez SDK
        </p>
      </div>



      {/* Call-to-action buttons */}
      <div className="space-y-4 flex-col flex w-full max-w-md justify-center mt-20">
        <PrimaryButton
          onClick={onCreateNewWallet}
          className="w-full py-4 text-lg"
        >
          Create New Wallet
        </PrimaryButton>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[rgb(var(--background-rgb))] text-[rgb(var(--text-white))] opacity-70">
              or
            </span>
          </div>
        </div>

        <button
          onClick={onRestoreWallet}
          className="w-full py-4 border border-[rgb(var(--text-white))] text-[rgb(var(--text-white))] rounded-lg hover:bg-[rgb(var(--card-border))] transition-colors text-lg"
        >
          RESTORE EXISTING WALLET
        </button>
        <div></div>
      </div>
    </div>
  );
};

export default HomePage;
