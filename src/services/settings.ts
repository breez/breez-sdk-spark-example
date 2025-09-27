import { Fee } from "@breeztech/breez-sdk-spark/web";

export interface UserSettings {
  depositMaxFee: Fee;
  syncIntervalSecs?: number;
  lnurlDomain?: string;
  preferSparkOverLightning?: boolean;
}

const SETTINGS_KEY = 'user_settings_v1';

const defaultSettings: UserSettings = {
  depositMaxFee: { type: 'fixed', amount: 1 },
};

export function getSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    // Merge with defaults defensively
    const depositMaxFee = parsed?.depositMaxFee ?? defaultSettings.depositMaxFee;
    if (depositMaxFee && depositMaxFee.type === 'fixed' && typeof depositMaxFee.amount !== 'number') {
      return defaultSettings;
    }
    if (depositMaxFee && depositMaxFee.type === 'rate' && typeof depositMaxFee.satPerVbyte !== 'number') {
      return defaultSettings;
    }
    const out: UserSettings = {
      depositMaxFee: depositMaxFee as Fee,
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
