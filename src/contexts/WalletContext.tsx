import React, { createContext, useContext } from 'react';
import type { WalletAPI } from '../api/WalletAPI';
import { walletApiImpl } from '../api/WalletApiImpl';

const WalletContext = createContext<WalletAPI | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode; api?: WalletAPI }> = ({ children, api }) => {
  const value = api ?? walletApiImpl;
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletAPI => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
    }
  return ctx;
};
