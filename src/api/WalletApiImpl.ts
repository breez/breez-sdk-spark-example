import * as walletService from '../services/walletService';
import type { WalletAPI } from './WalletAPI';

export const walletApiImpl: WalletAPI = {
  // Lifecycle
  initWallet: walletService.initWallet,
  disconnect: walletService.disconnect,

  // Payments
  parseInput: walletService.parseInput,
  prepareSendPayment: walletService.prepareSendPayment,
  sendPayment: walletService.sendPayment,
  receivePayment: walletService.receivePayment,

  // Data
  getWalletInfo: walletService.getWalletInfo,
  getTransactions: walletService.getTransactions,

  // Events
  addEventListener: walletService.addEventListener,
  removeEventListener: walletService.removeEventListener,

  // Storage helpers
  saveMnemonic: walletService.saveMnemonic,
  getSavedMnemonic: walletService.getSavedMnemonic,
  clearMnemonic: walletService.clearMnemonic,

  // Lightning Address
  getLightningAddress: walletService.getLightningAddress,
  checkLightningAddressAvailable: walletService.checkLightningAddressAvailable,
  registerLightningAddress: walletService.registerLightningAddress,
  deleteLightningAddress: walletService.deleteLightningAddress,
};
