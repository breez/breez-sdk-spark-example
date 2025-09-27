export type DepositMaxFeeSetting =
  | { type: 'fixed'; amount: number }
  | { type: 'relative'; percentage: number };

export interface UserSettings {
  depositMaxFee: DepositMaxFeeSetting;
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
    if (depositMaxFee && depositMaxFee.type === 'fixed' && typeof (depositMaxFee as any).amount !== 'number') {
      return defaultSettings;
    }
    if (depositMaxFee && depositMaxFee.type === 'relative' && typeof (depositMaxFee as any).percentage !== 'number') {
      return defaultSettings;
    }
    return {
      depositMaxFee: depositMaxFee as DepositMaxFeeSetting,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
