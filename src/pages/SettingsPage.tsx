import React, { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { PrimaryButton, FormGroup, FormInput, FormError, LoadingSpinner } from '../components/ui';
import { getSettings, saveSettings, UserSettings } from '../services/settings';
import type { Config } from '@breeztech/breez-sdk-spark';
import { useWallet } from '@/contexts/WalletContext';

interface SettingsPageProps {
  onBack: () => void;
  config: Config | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, config }) => {
  const wallet = useWallet();
  const [isOpen, setIsOpen] = useState(true);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [feeType, setFeeType] = useState<'fixed' | 'rate' | 'networkRecommended'>('fixed');
  const [feeValue, setFeeValue] = useState<string>('1');
  const [error, setError] = useState<string | null>(null);
  // New settings fields
  const [syncIntervalSecs, setSyncIntervalSecs] = useState<string>('');
  const [lnurlDomain, setLnurlDomain] = useState<string>('');
  const [preferSparkOverLightning, setPreferSparkOverLightning] = useState<boolean>(false);
  // SDK user settings
  const [sparkPrivateModeEnabled, setSparkPrivateModeEnabled] = useState<boolean>(false);
  const [isLoadingUserSettings, setIsLoadingUserSettings] = useState<boolean>(true);

  useEffect(() => {
    // Determine dev mode once on mount from URL param
    const params = new URLSearchParams(window.location.search);
    setIsDevMode(params.get('dev') === 'true');

    const s = getSettings();
    if (s.depositMaxFee.type === 'fixed') {
      setFeeType('fixed');
      setFeeValue(String(s.depositMaxFee.amount));
    } else if (s.depositMaxFee.type === 'rate') {
      setFeeType('rate');
      setFeeValue(String(s.depositMaxFee.satPerVbyte));
    } else if (s.depositMaxFee.type === 'networkRecommended') {
      setFeeType('networkRecommended');
      setFeeValue(String(s.depositMaxFee.leewaySatPerVbyte));
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
    // Load user settings from SDK (spark private mode)
    (async () => {
      try {
        setIsLoadingUserSettings(true);
        const us = await wallet.getUserSettings();
        setSparkPrivateModeEnabled(!!us.sparkPrivateModeEnabled);
      } catch (e) {
        console.warn('Failed to load user settings from SDK:', e);
      } finally {
        setIsLoadingUserSettings(false);
      }
    })();
  }, [config, wallet]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onBack, 220);
  };

  const handleSave = async () => {
    const n = Number(feeValue);
    if (Number.isNaN(n) || n < 0) {
      setError('Please enter a valid fee');
      return;
    }
    setError(null);
    if (isDevMode) {
      const updated: UserSettings = {
        ...(feeType === 'fixed'
          ? { depositMaxFee: { type: 'fixed', amount: Math.floor(n) } }
          : feeType === 'rate'
            ? { depositMaxFee: { type: 'rate', satPerVbyte: n } }
            : { depositMaxFee: { type: 'networkRecommended', leewaySatPerVbyte: Math.max(0, Math.floor(n)) } }
        ),
        syncIntervalSecs: syncIntervalSecs !== '' ? Math.max(0, Math.floor(Number(syncIntervalSecs))) : undefined,
        lnurlDomain: lnurlDomain !== '' ? lnurlDomain : undefined,
        preferSparkOverLightning,
      };
      saveSettings(updated);
    }
    // Persist SDK user settings (currently only sparkPrivateModeEnabled)
    try {
      await wallet.setUserSettings({ sparkPrivateModeEnabled });
    } catch (e) {
      console.warn('Failed to update SDK user settings:', e);
    }
    // Reload to apply new config values on next connect
    window.location.reload();
  };

  const handleDownloadLogs = () => {
    try {
      const content = wallet.getSdkLogs();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:]/g, '-');
      a.href = url;
      a.download = `sdk-logs-${ts}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Failed to download logs:', e);
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
              {isDevMode && (
                <div className="card-no-border p-4">
                  <FormGroup>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="block text-sm text-[rgb(var(--text-white))] opacity-80">Max Deposit Claim Fee</span>
                      <span className="text-xs text-[rgb(var(--text-white))] opacity-60">(fixed, rate, or network recommended leeway)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <select
                        value={feeType}
                        onChange={(e) => setFeeType(e.currentTarget.value as 'fixed' | 'rate' | 'networkRecommended')}
                        className="min-w-[170px] bg-transparent border border-[rgb(var(--card-border))] rounded-md px-2 py-2 text-[rgb(var(--text-white))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-blue))]"
                        aria-label="Max fee type"
                      >
                        <option className="bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))]" value="fixed">Fixed (sats)</option>
                        <option className="bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))]" value="rate">Rate (sat/vB)</option>
                        <option className="bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))]" value="networkRecommended">Network recommended (leeway sat/vB)</option>
                      </select>
                      <div className="flex-1">
                        <FormInput
                          id="deposit-fee-default"
                          type="number"
                          min={0}
                          value={feeValue}
                          onChange={(e) => setFeeValue(e.target.value)}
                          placeholder={
                            feeType === 'fixed'
                              ? 'Max fee in sats'
                              : feeType === 'rate'
                                ? 'Max fee in sat/vB'
                                : 'Leeway from network fee (sat/vB)'
                          }
                        />
                      </div>
                    </div>

                    <FormError error={error} />
                  </FormGroup>
                </div>
              )}

              {isDevMode && (
                <div className="card-no-border p-4">
                  <FormGroup>
                    <label className="block text-sm text-[rgb(var(--text-white))] opacity-80 mb-2">SDK Logs</label>
                    <button
                      className="px-3 py-2 text-sm border border-[rgb(var(--card-border))] rounded text-[rgb(var(--text-white))] hover:bg-[rgb(var(--card-border))]"
                      type="button"
                      onClick={handleDownloadLogs}
                    >
                      Download SDK Logs
                    </button>
                  </FormGroup>
                </div>
              )}

              {isDevMode && (
                <div className="card-no-border p-4">
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
              )}

              {isDevMode && (
                <div className="card-no-border p-4">
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
              )}

              {isDevMode && (
                <div className="card-no-border p-4">
                  <FormGroup>
                    <label className="block text-sm text-[rgb(var(--text-white))] opacity-80 mb-1">Prefer Spark</label>
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
              )}

              <div className="card-no-border p-4">
                <FormGroup>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="block text-sm text-[rgb(var(--text-white))] opacity-80">Private Mode</span>
                    {isLoadingUserSettings && (
                      <LoadingSpinner size="small" />
                    )}
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={sparkPrivateModeEnabled}
                      disabled={isLoadingUserSettings}
                      onChange={(e) => setSparkPrivateModeEnabled(e.currentTarget.checked)}
                    />
                    <span className="text-[rgb(var(--text-white))] opacity-90">Hide my address from public explorers (not suitable for zaps)</span>
                  </label>
                </FormGroup>
              </div>
            </div>

            <div className="p-4 border-[rgb(var(--card-border))]">
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
