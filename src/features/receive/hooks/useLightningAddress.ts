import { useCallback, useState } from 'react';
import { useWallet } from '../../../contexts/WalletContext';

export interface UseLightningAddress {
  address: string | null;
  isLoading: boolean;
  isEditing: boolean;
  editValue: string;
  error: string | null;
  load: () => Promise<void>;
  beginEdit: (currentAddress?: string | null) => void;
  cancelEdit: () => void;
  setEditValue: (v: string) => void;
  save: (description?: string) => Promise<void>;
  reset: () => void;
}

export const useLightningAddress = (): UseLightningAddress => {
  const wallet = useWallet();

  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const extractUsername = (value: string): string => {
    if (!value) return '';
    return value.includes('@') ? value.split('@')[0] : value;
  };

  const generateRandomLetterString = (length: number): string => {
    const characters = "abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      let addr = await wallet.getLightningAddress();
      if (!addr) {
        const randomString = generateRandomLetterString(6);
        await wallet.registerLightningAddress(randomString, 'randomString@breez.tips');
        addr = await wallet.getLightningAddress();
      }
      setAddress(addr);
    } catch (err) {
      console.error('Failed to load Lightning address:', err);
      setError(`Failed to load Lightning address: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  const beginEdit = useCallback((currentAddress?: string | null) => {
    const initial = extractUsername(currentAddress ?? address ?? '');
    setEditValue(initial);
    setIsEditing(true);
    setError(null);
  }, [address]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
    setError(null);
  }, []);

  const save = useCallback(async (description?: string) => {
    const username = extractUsername(editValue.trim());
    if (!username) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isAvailable = await wallet.checkLightningAddressAvailable(username);
      if (!isAvailable) {
        setError('This username is not available');
        setIsLoading(false);
        return;
      }

      await wallet.registerLightningAddress(username, description || 'Lightning Address');
      const actualAddress = await wallet.getLightningAddress();
      setAddress(actualAddress);
      setIsEditing(false);
      setEditValue('');
    } catch (err) {
      console.error('Failed to save Lightning address:', err);
      setError(`Failed to save Lightning address: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [editValue, wallet]);

  const reset = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
    setError(null);
  }, []);

  return {
    address,
    isLoading,
    isEditing,
    editValue,
    error,
    load,
    beginEdit,
    cancelEdit,
    setEditValue,
    save,
    reset,
  };
};
