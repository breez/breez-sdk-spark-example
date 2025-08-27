import initBreezSDK from '@breeztech/breez-sdk-spark';

// Flag to ensure we only initialize once
let initialized = false;

// Function to initialize the WASM module
export const initWasm = async (): Promise<void> => {
  if (initialized) {
    return;
  }

  try {
    // Initialize the WASM module
    console.log('Initializing WASM module...');
    await initBreezSDK();
    console.log('WASM module initialized successfully');
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize WASM module:', error);
    throw error;
  }
};

// Check if WASM has been initialized
export const isWasmInitialized = (): boolean => {
  return initialized;
};
