import { LogCategory, logger } from '@/services/logger';
import { deviceOnlyStorage, secureStorage } from '@/services/secureStorage';
import { ripemd160 } from '@noble/hashes/legacy';
import { sha256 } from '@noble/hashes/sha2';
import { bech32 } from '@scure/base';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync, validateMnemonic } from 'bip39';
import type { WalletKey } from './driver';

export interface FundingKey {
  address: string;
  publicKeyHex: string;
  secretKey: Uint8Array;
}

interface NetworkParams {
  hrp: string;
  coinType: number;
}

const networkParams = (network: string): NetworkParams => {
  switch (network) {
    case 'testnet':
      return { hrp: 'tb', coinType: 1 };
    case 'regtest':
      return { hrp: 'bcrt', coinType: 1 };
    default:
      return { hrp: 'bc', coinType: 0 };
  }
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

export function deriveFundingKey(mnemonic: string, network: string, index: number): FundingKey {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Recovery phrase is not valid');
  }

  const { hrp, coinType } = networkParams(network);
  const seed = mnemonicToSeedSync(mnemonic);
  const node = HDKey.fromMasterSeed(seed).derive(`m/84'/${coinType}'/0'/0/${index}`);
  if (!node.publicKey || !node.privateKey) {
    throw new Error('Failed to derive the funding key');
  }

  const witnessProgram = ripemd160(sha256(node.publicKey));
  const address = bech32.encode(hrp, [0, ...bech32.toWords(witnessProgram)]);

  return {
    address,
    publicKeyHex: toHex(node.publicKey),
    secretKey: node.privateKey,
  };
}

const key = ({ identityPubkey, network }: WalletKey): string =>
  `unilateral-exit-funding-index:${identityPubkey.slice(0, 16)}:${network}`;

export function readFundingIndex(wallet: WalletKey): number {
  const raw = localStorage.getItem(key(wallet));
  const parsed = raw === null ? 0 : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function bumpFundingIndex(wallet: WalletKey): number {
  const next = readFundingIndex(wallet) + 1;
  localStorage.setItem(key(wallet), String(next));
  return next;
}

export class MnemonicUnavailableError extends Error {
  constructor() {
    super('Recovery mode needs this wallet\'s recovery phrase on this device');
    this.name = 'MnemonicUnavailableError';
  }
}

export async function readWalletMnemonic(): Promise<string> {
  if (deviceOnlyStorage.isSupported() && (await deviceOnlyStorage.hasStoredSeed())) {
    try {
      const seed = await deviceOnlyStorage.retrieveSeed();
      if (seed.type === 'mnemonic') return seed.mnemonic;
    } catch (e) {
      logger.warn(LogCategory.AUTH, 'Failed to read seed from device-only storage', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (secureStorage.isSupported() && (await secureStorage.hasStoredSeed())) {
    try {
      const seed = await secureStorage.retrieveSeed();
      if (seed.type === 'mnemonic') return seed.mnemonic;
    } catch (e) {
      logger.warn(LogCategory.AUTH, 'Failed to read seed from biometric storage', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const legacy = localStorage.getItem('walletMnemonic');
  if (legacy) return legacy;

  throw new MnemonicUnavailableError();
}
