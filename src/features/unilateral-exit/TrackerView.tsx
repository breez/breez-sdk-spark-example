import React, { useMemo } from 'react';
import { BackupCard } from './BackupCard';
import { AlertCard } from '@/components/AlertCard';
import { CheckCircleIcon, ClockIcon } from '@/components/Icons';
import { SatAmount } from '@/components/SatAmount';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { blocksToFinish, exitStages, nextAction, planProgress, willReceiveSat } from './driver';
import type { NextAction, PlanProgress, UnilateralExitPlan } from './driver';
import { formatBlockWait } from '@/utils/blockTime';

const Stage: React.FC<{ label: string; sats: number; dot: string; dim?: boolean }> = ({
  label,
  sats,
  dot,
  dim,
}) => (
  <div className="flex items-center gap-3 py-1.5">
    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
    <span className="flex-1 text-spark-text-secondary text-sm">{label}</span>
    <SatAmount
      sats={sats}
      className={`text-sm ${dim ? 'text-spark-text-muted' : 'text-spark-text-primary'}`}
    />
  </div>
);

const ExitSummary: React.FC<{
  plan: UnilateralExitPlan;
  blocksLeft: number | null;
  progress: PlanProgress;
  next: NextAction | null;
  isAdvancing: boolean;
}> = ({ plan, blocksLeft, next, isAdvancing, progress }) => {
  const stages = exitStages(plan);
  const total = stages.inSpark + stages.onChain + stages.delivered;
  const feesSat = Math.max(0, plan.exit.recoverableValueSat - stages.willReceive);

  return (
    <div className="bg-spark-dark border border-spark-border rounded-2xl p-5 space-y-4">
      <div className="text-center">
        <h2 className="font-display font-semibold text-spark-text-primary text-lg">
          {plan.phase === 'redo' ? 'This exit needs rebuilding' : 'Moving your funds out'}
        </h2>
        <p className="text-spark-text-muted text-sm mt-1" data-testid="unilateral-exit-eta">
          {blocksLeft === null ? 'almost there' : `about ${formatBlockWait(blocksLeft).replace('~', '')} left`}
          {' · '}
          {progress.confirmed} of {progress.total} steps done
        </p>
      </div>

      {/* Steps, not money: refunds land in a few late jumps, so a money bar sits
          at zero for most of an exit and reads as stuck. The amounts below say
          where the money is. */}
      <div className="flex h-2 rounded-full overflow-hidden bg-spark-border">
        <div
          className="bg-spark-electric transition-all duration-500"
          style={{ width: progress.total > 0 ? `${(progress.confirmed / progress.total) * 100}%` : '0%' }}
        />
      </div>

      {total > 0 && (
        <div data-testid="unilateral-exit-stages">
          <Stage label="At your address" sats={stages.delivered} dot="bg-spark-success" dim={stages.delivered === 0} />
          <Stage label="Out of Spark, safe on-chain" sats={stages.onChain} dot="bg-spark-electric" dim={stages.onChain === 0} />
          <Stage label="Still in Spark" sats={stages.inSpark} dot="bg-spark-border" dim={stages.inSpark === 0} />
        </div>
      )}

      <div className="border-t border-spark-border pt-3">
        <div className="flex items-baseline gap-3">
          <span className="flex-1 text-spark-text-secondary text-sm">
            {stages.delivered > 0 ? 'Received' : "You'll receive"}
          </span>
          <SatAmount sats={stages.willReceive} className="text-xl text-spark-text-primary" />
        </div>
        <p className="text-spark-text-muted text-xs mt-1">
          about, from <SatAmount sats={plan.exit.recoverableValueSat} /> less{' '}
          <SatAmount sats={feesSat} /> for the final sweep. A step the operators&apos; watchtower
          sends instead pays its own fee from your balance too, so the final figure can come in
          under this.
        </p>
      </div>

      <div className="flex items-center gap-2.5 bg-spark-dark/60 border border-spark-border rounded-xl px-3 py-2.5">
        <ClockIcon size="md" className="shrink-0 text-spark-electric" />
        <span className="text-spark-text-primary text-sm font-medium">
          {isAdvancing
            ? 'Checking the blockchain...'
            : next === null
              ? 'Waiting on confirmations'
              : `Next ${next.transactions === 1 ? 'step' : `${next.transactions} steps`} ${formatBlockWait(next.blocks)}`}
        </span>
      </div>
    </div>
  );
};

export const TrackerView: React.FC<{
  plan: UnilateralExitPlan;
  tipHeight: number | null;
  isAdvancing: boolean;
  onRebuild: () => void;
  onDone: () => void;
}> = ({ plan, tipHeight, isAdvancing, onRebuild, onDone }) => {
  const { transactions } = plan.exit;
  const progress = useMemo(() => planProgress(plan), [plan]);
  const refusal = Object.values(plan.refusals)[0];
  const next = useMemo(
    () => (tipHeight === null ? null : nextAction(transactions, tipHeight)),
    [transactions, tipHeight],
  );
  const blocksLeft = useMemo(
    () => (tipHeight === null ? null : blocksToFinish(transactions, tipHeight)),
    [transactions, tipHeight],
  );

  if (progress.isComplete) {
    const delivered = willReceiveSat(plan);
    const balance = plan.exit.recoverableValueSat;
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-spark-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon size="xl" className="text-spark-success" />
          </div>
          <h2
            className="font-display font-semibold text-spark-text-primary text-lg mb-2"
            data-testid="unilateral-exit-complete"
          >
            Unilateral exit complete
          </h2>
          <p className="text-spark-text-muted text-sm">
            <SatAmount sats={delivered} /> reached your address.
          </p>
        </div>

        {/* The gap between the balance and what arrived is the first thing
            anyone asks about, in either direction. */}
        <div className="bg-spark-dark border border-spark-border rounded-2xl p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-spark-text-secondary">You had</span>
            <SatAmount sats={balance} className="text-spark-text-primary" />
          </div>
          {delivered < balance ? (
            <div className="flex items-center justify-between">
              <span className="text-spark-text-secondary">Mining fees</span>
              <span className="text-spark-text-primary">
                &minus;<SatAmount sats={balance - delivered} />
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-spark-text-secondary">Unused funding returned</span>
              <span className="text-spark-text-primary">
                +<SatAmount sats={delivered - balance} />
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-spark-border pt-2">
            <span className="text-spark-text-secondary">Reached your address</span>
            <SatAmount sats={delivered} className="text-spark-text-primary" />
          </div>
        </div>

        <PrimaryButton onClick={onDone} className="w-full">
          Done
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="unilateral-exit-tracker">
      <ExitSummary
        plan={plan}
        blocksLeft={blocksLeft}
        next={next}
        progress={progress}
        isAdvancing={isAdvancing}
      />

      {plan.phase === 'active' && refusal && (
        <AlertCard variant="warning" title="The network refused a step">
          <p className="text-xs font-mono break-all" data-testid="unilateral-exit-refusal">
            {refusal}
          </p>
          <p className="text-sm mt-2">
            Glow keeps retrying, and another copy of the step may confirm instead. If this
            persists, rebuild the exit at a higher fee.
          </p>
        </AlertCard>
      )}

      {plan.phase === 'redo' && (
        <AlertCard variant="warning" title="Rebuild to keep going">
          <p className="text-sm">
            The blockchain no longer matches the transactions saved here. Your money is safe:
            it is still in the tree, or already in an output you control.
          </p>
          <div className="mt-3">
            <PrimaryButton onClick={onRebuild} className="w-full" data-testid="unilateral-exit-rebuild">
              Rebuild the exit
            </PrimaryButton>
          </div>
        </AlertCard>
      )}

      {plan.lastCheckError && (
        <AlertCard variant="warning" title="Cannot read the exit right now">
          <p className="text-sm">
            Glow could not reach the blockchain to check on this exit, so what you see may be out
            of date. It keeps trying.
          </p>
        </AlertCard>
      )}

      <BackupCard frozen={plan.exitStateSnapshot} />

      {plan.phase === 'active' && (
        <SecondaryButton
          onClick={onRebuild}
          className="w-full"
          data-testid="unilateral-exit-bump-fee"
        >
          Not confirming? Rebuild at a higher fee
        </SecondaryButton>
      )}

      <p className="text-spark-text-muted text-xs text-center px-4">
        You can close this. Glow picks the exit back up whenever you open it, and sends whatever
        became ready while you were away.
      </p>
    </div>
  );
};
