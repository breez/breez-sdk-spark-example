/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BREEZ_API_KEY: string;
  // Add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
