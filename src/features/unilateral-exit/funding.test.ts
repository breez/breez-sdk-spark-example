import { deriveFundingKey } from './funding';
import { describe, expect, it } from 'vitest';

const VECTOR_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('deriveFundingKey', () => {
  it('derives the first BIP84 mainnet address of the reference mnemonic', () => {
    const key = deriveFundingKey(VECTOR_MNEMONIC, 'mainnet', 0);
    expect(key.address).toBe('bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');
    expect(key.publicKeyHex).toBe(
      '0330d54fd0dd420a6e5f8d3624f5f3482cae350f79d5f0753bf5beef9c2d91af3c',
    );
  });

  it('derives the second address of the same account', () => {
    const key = deriveFundingKey(VECTOR_MNEMONIC, 'mainnet', 1);
    expect(key.address).toBe('bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g');
    expect(key.publicKeyHex).toBe(
      '03e775fd51f0dfb8cd865d9ff1cca2a158cf651fe997fdc9fee9c1d3b5e995ea77',
    );
  });

  it('returns a 32 byte secret key', () => {
    expect(deriveFundingKey(VECTOR_MNEMONIC, 'mainnet', 0).secretKey).toHaveLength(32);
  });

  it('uses the testnet coin type and prefix on testnet', () => {
    const key = deriveFundingKey(VECTOR_MNEMONIC, 'testnet', 0);
    expect(key.address.startsWith('tb1q')).toBe(true);
  });

  it('uses the regtest prefix on regtest', () => {
    const key = deriveFundingKey(VECTOR_MNEMONIC, 'regtest', 0);
    expect(key.address.startsWith('bcrt1q')).toBe(true);
  });

  it('gives testnet and mainnet different keys', () => {
    const mainnet = deriveFundingKey(VECTOR_MNEMONIC, 'mainnet', 0);
    const testnet = deriveFundingKey(VECTOR_MNEMONIC, 'testnet', 0);
    expect(testnet.publicKeyHex).not.toBe(mainnet.publicKeyHex);
  });

  it('gives every index its own address', () => {
    const first = deriveFundingKey(VECTOR_MNEMONIC, 'mainnet', 0);
    const second = deriveFundingKey(VECTOR_MNEMONIC, 'mainnet', 1);
    expect(second.address).not.toBe(first.address);
  });

  it('is deterministic for the same inputs', () => {
    expect(deriveFundingKey(VECTOR_MNEMONIC, 'mainnet', 3)).toEqual(
      deriveFundingKey(VECTOR_MNEMONIC, 'mainnet', 3),
    );
  });

  it('rejects a mnemonic that is not valid', () => {
    expect(() => deriveFundingKey('not a real mnemonic at all', 'mainnet', 0)).toThrow();
  });
});
