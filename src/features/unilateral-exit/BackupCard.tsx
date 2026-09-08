import React, { useRef, useState } from 'react';
import { AlertCard } from '@/components/AlertCard';
import { SecondaryButton } from '@/components/ui';
import { useWallet } from '@/contexts/WalletContext';
import { logger, LogCategory } from '@/services/logger';
import { exportUnilateralExitBackup, importUnilateralExitBackup } from './backup';

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * Saving and restoring the data an exit needs. Offered wherever an exit can be
 * started, not only once one is running: the file exists for the case where the
 * operators have stopped answering and nothing else can supply it.
 *
 * `frozen` is an in-flight exit's own copy, saved in preference to a fresh
 * export.
 */
export const BackupCard: React.FC<{ frozen?: string }> = ({ frozen }) => {
  const wallet = useWallet();
  const [busy, setBusy] = useState<'saving' | 'restoring' | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const save = async () => {
    setBusy('saving');
    setError(null);
    setResult(null);
    try {
      await exportUnilateralExitBackup(wallet, frozen);
    } catch (e) {
      logger.warn(LogCategory.SDK, 'Failed to save the unilateral exit backup', { error: message(e) });
      setError(message(e));
    } finally {
      setBusy(null);
    }
  };

  const restore = async (file: File) => {
    setBusy('restoring');
    setError(null);
    setResult(null);
    try {
      const restored = await importUnilateralExitBackup(wallet, file);
      setResult(
        restored.importedLeaves > 0
          ? `Restored ${restored.importedLeaves} ${restored.importedLeaves === 1 ? 'leaf' : 'leaves'}. You can start the exit.`
          : restored.skippedForeignLeaves > 0
            ? 'That backup belongs to a different wallet.'
            : 'Nothing new in that backup: this wallet already holds it.',
      );
    } catch (e) {
      logger.warn(LogCategory.SDK, 'Failed to restore the unilateral exit backup', { error: message(e) });
      setError(message(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <AlertCard variant="warning" title="Back this up">
      <p className="text-sm">
        Only this device holds the data that moves these funds on-chain. Once the operators stop
        answering, nothing else can supply it, so keep a copy off this device alongside your
        recovery phrase.
      </p>

      {result && <p className="text-sm mt-2 text-spark-text-primary" data-testid="unilateral-exit-backup-result">{result}</p>}
      {error && <p className="text-sm mt-2 text-spark-error" data-testid="unilateral-exit-backup-error">{error}</p>}

      <div className="mt-3 space-y-2">
        <SecondaryButton
          onClick={() => void save()}
          disabled={busy !== null}
          className="w-full"
          data-testid="unilateral-exit-backup-save"
        >
          {busy === 'saving' ? 'Preparing...' : 'Save a copy'}
        </SecondaryButton>
        <SecondaryButton
          onClick={() => picker.current?.click()}
          disabled={busy !== null}
          className="w-full"
          data-testid="unilateral-exit-backup-restore"
        >
          {busy === 'restoring' ? 'Restoring...' : 'Restore from a backup'}
        </SecondaryButton>
        <input
          ref={picker}
          type="file"
          accept=".zip,.json,application/zip,application/json"
          className="hidden"
          data-testid="unilateral-exit-backup-file"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void restore(file);
          }}
        />
      </div>
    </AlertCard>
  );
};
