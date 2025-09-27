import React, { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { PrimaryButton, FormGroup, FormInput, FormError } from '../components/ui';
import { getSettings, saveSettings, UserSettings } from '../services/settings';

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [feeType, setFeeType] = useState<'fixed' | 'relative'>('fixed');
  const [feeValue, setFeeValue] = useState<string>('1');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSettings();
    if (s.depositMaxFee.type === 'fixed') {
      setFeeType('fixed');
      setFeeValue(String(s.depositMaxFee.amount));
    } else {
      setFeeType('relative');
      setFeeValue(String(s.depositMaxFee.percentage));
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onBack, 220);
  };

  const handleSave = () => {
    const n = Number(feeValue);
    if (Number.isNaN(n) || n < 0) {
      setError('Please enter a valid fee');
      return;
    }
    setError(null);
    const updated: UserSettings =
      feeType === 'fixed'
        ? { depositMaxFee: { type: 'fixed', amount: Math.floor(n) } }
        : { depositMaxFee: { type: 'relative', percentage: n } };
    saveSettings(updated);
    handleClose();
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
            <div className="relative px-4 py-3 border-b border-[rgb(var(--card-border))]">
              <h1 className="text-center text-lg font-semibold text-[rgb(var(--text-white))]">Settings</h1>
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
              <div className="card-no-border p-4">
                <h2 className="text-[rgb(var(--text-white))] font-medium mb-3">Max Fee for Deposit</h2>
                <FormGroup>
                  <div className="flex gap-2 mb-2">
                    <button
                      className={`px-3 py-1 rounded ${feeType === 'fixed' ? 'bg-[var(--primary-blue)] text-white' : 'bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))]'}`}
                      onClick={() => setFeeType('fixed')}
                      type="button"
                    >
                      Absolute (sats)
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${feeType === 'relative' ? 'bg-[var(--primary-blue)] text-white' : 'bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))]'}`}
                      onClick={() => setFeeType('relative')}
                      type="button"
                    >
                      Relative (%)
                    </button>
                  </div>

                  <div>
                    <FormInput
                      id="deposit-fee-default"
                      type="number"
                      min={0}
                      value={feeValue}
                      onChange={(e) => setFeeValue(e.target.value)}
                      placeholder={feeType === 'fixed' ? 'Max fee in sats' : 'Max fee in %'}
                    />
                  </div>

                  <FormError error={error} />
                </FormGroup>
              </div>
            </div>

            <div className="p-4 border-t border-[rgb(var(--card-border))]">
              <PrimaryButton className="w-full" onClick={handleSave}>
                Save
              </PrimaryButton>
            </div>
          </div>
        </Transition.Child>
      </Transition>
    </div>
  );
};

export default SettingsPage;
