import * as breezSdk from '@breeztech/breez-sdk-spark/web';
import {
  BreezSdk,
  Config,
  GetInfoRequest,
  GetInfoResponse,
  ListPaymentsRequest,
  ListPaymentsResponse,
  Payment,
  SendPaymentRequest,
  SendPaymentResponse,
  ReceivePaymentRequest,
  ReceivePaymentResponse,
  PrepareSendPaymentRequest,
  PrepareSendPaymentResponse,
  PrepareReceivePaymentRequest,
  PrepareReceivePaymentResponse,
  SdkEvent,
  EventListener,
  LogEntry,
  initLogging
} from '@breeztech/breez-sdk-spark/web';

class WebLogger {
  log = (logEntry: LogEntry) => {
    console.log(`[${logEntry.level}]: ${logEntry.line}`)
  }
}
// Private SDK instance - not exposed outside this module
let sdk: BreezSdk | null = null;

export const initWallet = async (mnemonic: string, config: Config): Promise<void> => {
  try {
    const logger = new WebLogger();
    initLogging(logger);
    // Create config using the new API
    const urlParams = new URLSearchParams(window.location.search);
    // Create SDK builder with config, mnemonic, and data directory
    let builder = breezSdk.SdkBuilder.new(config, mnemonic, './breez_data');
    if (config.network === 'regtest') {
      builder = builder.withRestChainService('https://regtest-mempool.loadtest.dev.sparkinfra.net/api', {
        username: urlParams.get('username') ?? '',
        password: urlParams.get('password') ?? ''
      });
    }
    // Build the SDK instance
    sdk = await builder.build();

    // Start the SDK    
    console.log('Wallet initialized successfully');

    // Return void instead of the SDK instance
  } catch (error) {
    console.error('Failed to initialize wallet:', error);
    throw error;
  }
};

// Remove getSdk() method

// Add specific methods for actions components need to perform
// Payment Operations
export const parseInput = async (input: string): Promise<breezSdk.InputType> => {
  // Use the module-level parse function instead of SDK instance method
  return await breezSdk.parse(input);
};

export const prepareSendPayment = async (
  params: PrepareSendPaymentRequest
): Promise<PrepareSendPaymentResponse> => {
  if (!sdk) throw new Error('SDK not initialized');
  return await sdk.prepareSendPayment(params);
};

export const sendPayment = async (
  params: SendPaymentRequest
): Promise<SendPaymentResponse> => {
  if (!sdk) throw new Error('SDK not initialized');
  return await sdk.sendPayment(params);
};

// Invoice and Receiving Operations
export const prepareReceivePayment = async (
  params: PrepareReceivePaymentRequest
): Promise<PrepareReceivePaymentResponse> => {
  if (!sdk) throw new Error('SDK not initialized');
  return await sdk.prepareReceivePayment(params);
};

export const receivePayment = async (
  params: ReceivePaymentRequest
): Promise<ReceivePaymentResponse> => {
  if (!sdk) throw new Error('SDK not initialized');
  return await sdk.receivePayment(params);
};

// Event handling
export const addEventListener = async (
  callback: (event: SdkEvent) => void
): Promise<string> => {
  if (!sdk) {
    throw new Error('SDK not initialized');
  }

  try {
    // Create event listener
    const listener: EventListener = {
      onEvent: callback,
    };

    // Add event listener to SDK and return its ID
    const listenerId = await sdk.addEventListener(listener);
    console.log('Event listener added with ID:', listenerId);
    return listenerId;
  } catch (error) {
    console.error('Failed to add event listener:', error);
    throw error;
  }
};

// Remove event listener directly from the SDK
export const removeEventListener = async (listenerId: string): Promise<void> => {
  if (!sdk || !listenerId) {
    return;
  }

  try {
    await sdk.removeEventListener(listenerId);
    console.log('Event listener removed:', listenerId);
  } catch (error) {
    console.error(`Failed to remove event listener ${listenerId}:`, error);
    throw error;
  }
};

export const getWalletInfo = async (): Promise<GetInfoResponse | null> => {
  if (!sdk) {
    return null;
  }

  try {
    const request: GetInfoRequest = {};
    return await sdk.getInfo(request);
  } catch (error) {
    console.error('Failed to get wallet info:', error);
    throw error;
  }
};

export const getTransactions = async (): Promise<Payment[]> => {
  if (!sdk) {
    return [];
  }

  try {
    const request: ListPaymentsRequest = {
      offset: 0,
      limit: 100
    };
    const response: ListPaymentsResponse = await sdk.listPayments(request);
    return response.payments;
  } catch (error) {
    console.error('Failed to get transactions:', error);
    throw error;
  }
};

export const disconnect = async (): Promise<void> => {
  if (sdk) {
    try {
      // Disconnect SDK (this will clean up all listeners registered with it)
      await sdk.disconnect();
      sdk = null;
      // Remove reference to window.sdk
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }
};

// Helper to save mnemonic to localStorage
export const saveMnemonic = (mnemonic: string): void => {
  localStorage.setItem('walletMnemonic', mnemonic);
};

// Helper to retrieve mnemonic from localStorage
export const getSavedMnemonic = (): string | null => {
  return localStorage.getItem('walletMnemonic');
};

// Helper to clear mnemonic from localStorage
export const clearMnemonic = (): void => {
  localStorage.removeItem('walletMnemonic');
};
