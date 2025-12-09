import { MaxFee } from "@breeztech/breez-sdk-spark/web";

export interface UserSettings {
  depositMaxFee: MaxFee;
  syncIntervalSecs?: number;
  lnurlDomain?: string;
  preferSparkOverLightning?: boolean;
}

const SETTINGS_KEY = 'user_settings_v1';

const defaultSettings: UserSettings = {
  depositMaxFee: { type: 'rate', satPerVbyte: 1 },
};

export function getSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    // Merge with defaults defensively
    const depositMaxFee = parsed?.depositMaxFee ?? defaultSettings.depositMaxFee;
    if (depositMaxFee) {
      if (depositMaxFee.type === 'fixed' && typeof (depositMaxFee as any).amount !== 'number') {
        return defaultSettings;
      }
      if (depositMaxFee.type === 'rate' && typeof (depositMaxFee as any).satPerVbyte !== 'number') {
        return defaultSettings;
      }
      if (depositMaxFee.type === 'networkRecommended' && typeof (depositMaxFee as any).leewaySatPerVbyte !== 'number') {
        return defaultSettings;
      }
    }
    const out: UserSettings = {
      depositMaxFee: depositMaxFee as MaxFee,
      syncIntervalSecs: typeof parsed.syncIntervalSecs === 'number' ? parsed.syncIntervalSecs : undefined,
      lnurlDomain: typeof parsed.lnurlDomain === 'string' ? parsed.lnurlDomain : undefined,
      preferSparkOverLightning: typeof parsed.preferSparkOverLightning === 'boolean' ? parsed.preferSparkOverLightning : undefined,
    };
    return out;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
