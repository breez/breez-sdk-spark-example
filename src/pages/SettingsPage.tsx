import React, { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { PrimaryButton, FormGroup, FormInput, FormError } from '../components/ui';
import { getSettings, saveSettings, UserSettings } from '../services/settings';
import type { Config } from '@breeztech/breez-sdk-spark';

interface SettingsPageProps {
  onBack: () => void;
  config: Config | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, config }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [feeType, setFeeType] = useState<'fixed' | 'rate'>('fixed');
  const [feeValue, setFeeValue] = useState<string>('1');
  const [error, setError] = useState<string | null>(null);
  // New settings fields
  const [syncIntervalSecs, setSyncIntervalSecs] = useState<string>('');
  const [lnurlDomain, setLnurlDomain] = useState<string>('');
  const [preferSparkOverLightning, setPreferSparkOverLightning] = useState<boolean>(false);

  useEffect(() => {
    const s = getSettings();
    if (s.depositMaxFee.type === 'fixed') {
      setFeeType('fixed');
      setFeeValue(String(s.depositMaxFee.amount));
    } else {
      setFeeType('rate');
      setFeeValue(String(s.depositMaxFee.satPerVbyte));
    }

    // Defaults for new fields: prefer saved settings, otherwise fall back to config
    const cfg: any = config ?? {};
    setSyncIntervalSecs(
      typeof s.syncIntervalSecs === 'number'
        ? String(s.syncIntervalSecs)
        : (typeof cfg.syncIntervalSecs === 'number' ? String(cfg.syncIntervalSecs) : '')
    );
    setLnurlDomain(
      typeof s.lnurlDomain === 'string'
        ? s.lnurlDomain
        : (typeof cfg.lnurlDomain === 'string' ? cfg.lnurlDomain : '')
    );
    setPreferSparkOverLightning(
      typeof s.preferSparkOverLightning === 'boolean'
        ? s.preferSparkOverLightning
        : (typeof cfg.preferSparkOverLightning === 'boolean' ? cfg.preferSparkOverLightning : false)
    );
  }, [config]);

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
    const updated: UserSettings = {
      ...(feeType === 'fixed'
        ? { depositMaxFee: { type: 'fixed', amount: Math.floor(n) } }
        : { depositMaxFee: { type: 'rate', satPerVbyte: n } }),
      syncIntervalSecs: syncIntervalSecs !== '' ? Math.max(0, Math.floor(Number(syncIntervalSecs))) : undefined,
      lnurlDomain: lnurlDomain !== '' ? lnurlDomain : undefined,
      preferSparkOverLightning,
    };
    saveSettings(updated);
    // Reload to apply new config values on next connect
    window.location.reload();
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
                      className={`px-3 py-1 rounded ${feeType === 'rate' ? 'bg-[var(--primary-blue)] text-white' : 'bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))]'}`}
                      onClick={() => setFeeType('rate')}
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

              <div className="card-no-border p-4">
                <h2 className="text-[rgb(var(--text-white))] font-medium mb-3">Synchronization</h2>
                <FormGroup>
                  <label htmlFor="sync-interval" className="block text-sm text-[rgb(var(--text-white))] opacity-80 mb-1">Sync interval (seconds)</label>
                  <FormInput
                    id="sync-interval"
                    type="number"
                    min={0}
                    value={syncIntervalSecs}
                    onChange={(e) => setSyncIntervalSecs(e.target.value)}
                    placeholder="e.g. 30"
                  />
                </FormGroup>
              </div>

              <div className="card-no-border p-4">
                <h2 className="text-[rgb(var(--text-white))] font-medium mb-3">LNURL</h2>
                <FormGroup>
                  <label htmlFor="lnurl-domain" className="block text-sm text-[rgb(var(--text-white))] opacity-80 mb-1">LNURL domain</label>
                  <FormInput
                    id="lnurl-domain"
                    type="text"
                    value={lnurlDomain}
                    onChange={(e) => setLnurlDomain(e.target.value)}
                    placeholder="example.com"
                  />
                </FormGroup>
              </div>

              <div className="card-no-border p-4">
                <h2 className="text-[rgb(var(--text-white))] font-medium mb-3">Lightning Default</h2>
                <FormGroup>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={preferSparkOverLightning}
                      onChange={(e) => setPreferSparkOverLightning(e.currentTarget.checked)}
                    />
                    <span className="text-[rgb(var(--text-white))] opacity-90">Prefer Spark address over Lightning invoice (when available)</span>
                  </label>
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
