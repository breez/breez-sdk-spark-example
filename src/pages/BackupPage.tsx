import React, { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { Alert, PrimaryButton } from '@/components/ui';
import { useWallet } from '@/contexts/WalletContext';

interface BackupPageProps {
  onBack: () => void;
}

const BackupPage: React.FC<BackupPageProps> = ({ onBack }) => {
  const wallet = useWallet();
  const [isOpen, setIsOpen] = useState(true);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMnemonic(wallet.getSavedMnemonic());
  }, [wallet]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onBack, 220);
  };

  const handleCopy = async () => {
    if (!mnemonic) return;
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Failed to copy mnemonic:', e);
    }
  };

  return (
    <div className="absolute inset-0 z-50 overflow-hidden">
      <Transition show={isOpen} appear as="div" className="absolute inset-0">
        <Transition.Child
          as="div"
          enter="transform transition ease-out duration-300"
          enterFrom="translate-x-[-100%]"
          enterTo="translate-x-0"
          leave="transform transition ease-in duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-[-100%]"
          className="absolute inset-0"
        >
          <div className="flex flex-col h-full bg-[var(--card-bg)]">
            <div className="relative px-4 py-3 border-[rgb(var(--card-border))]">
              <h1 className="text-center text-lg font-semibold text-[rgb(var(--text-white))]">Backup</h1>
              <button
                onClick={handleClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-white))] hover:text-[rgb(var(--accent-red))] text-2xl"
                aria-label="Close"
                title="Close"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-4">
              <Alert type="warning">
                Your recovery phrase grants full access to your funds. Keep it offline and never share it.
              </Alert>

              <div className="card-no-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[rgb(var(--text-white))] opacity-80">Recovery phrase</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      disabled={!mnemonic}
                      className={`px-3 py-1 text-sm rounded ${copied ? 'bg-green-600 text-white' : 'border border-[rgb(var(--card-border))] text-[rgb(var(--text-white))] hover:bg-[rgb(var(--card-border))]'}`}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="bg-[rgb(var(--card-border))] rounded p-3 min-h-[64px]">
                  <p className="font-mono text-sm text-[rgb(var(--text-white))] break-words select-all">
                    {mnemonic ?? 'No mnemonic found'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-[rgb(var(--card-border))]">
              <PrimaryButton className="w-full" onClick={handleClose}>
                Done
              </PrimaryButton>
            </div>
          </div>
        </Transition.Child>
      </Transition>
    </div>
  );
};

export default BackupPage;
