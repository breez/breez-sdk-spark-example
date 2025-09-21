import type { FeeOptions } from '../types/domain';

// Default fee presets for Bitcoin transactions (sat/vB)
export const BITCOIN_FEE_PRESETS: FeeOptions = {
  fast: 20,
  medium: 10,
  slow: 5,
};
