// Shared domain types for the wallet example app

// Supported receive tabs / methods in Receive dialog
export type PaymentMethod = 'lightning' | 'spark' | 'bitcoin';

// Steps for the Receive dialog
export type ReceiveStep = 'loading_limits' | 'input' | 'qr' | 'loading';

// Steps for the Send dialog
export type PaymentStep = 'input' | 'amount' | 'confirm' | 'processing' | 'result';

// Common fee options structure (e.g., for on-chain fee presets)
export interface FeeOptions {
  fast: number;
  medium: number;
  slow: number;
}
