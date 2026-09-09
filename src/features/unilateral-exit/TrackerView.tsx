import React, { useMemo, useState } from 'react';
import { BackupActions, ExitActionRow } from './BackupCard';
import { AlertCard } from '@/components/AlertCard';
import { SatAmount } from '@/components/SatAmount';
import { CollapsibleSection, PrimaryButton } from '@/components/ui';
import { blocksToFinish, exitStages, nextAction, planProgress } from './driver';
import type { NextAction, PlanProgress, UnilateralExitPlan } from './driver';
import { formatDaysLeft } from '@/utils/blockTime';
import { formatWithSpaces } from '@/utils/formatNumber';

/** One labelled figure. No icon and no marker: the label is the whole story. */
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-spark-text-secondary text-sm shrink-0">{label}</span>
    <span className="text-sm text-spark-text-primary text-right">{children}</span>
  </div>
);

/** `x/y`, tight: a spaced slash reads as two separate figures. */
const Ratio: React.FC<{ done: React.ReactNode; total: React.ReactNode }> = ({ done, total }) => (
  <span className="font-mono [word-spacing:-0.4em]">
    {done}
    <span className="text-spark-text-muted">/</span>
    <span className="text-spark-text-secondary">{total}</span>
  </span>
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

  const status = isAdvancing
    ? 'Checking the blockchain...'
    : next === null
      ? 'Waiting for confirmations'
      : next.blocks > 0
        ? 'Waiting for timelock'
        : `Sending ${next.transactions === 1 ? 'the next step' : `${next.transactions} steps`}`;

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <p className="text-spark-text-muted text-sm mb-2">
          {plan.phase === 'redo' ? 'This exit needs rebuilding' : 'Processing'}
        </p>
        <SatAmount
          sats={stages.willReceive}
          className="text-4xl font-bold text-spark-text-primary"
        />
      </div>

      <div
        className="bg-spark-dark border border-spark-border rounded-2xl p-4 space-y-3"
        data-testid="unilateral-exit-stages"
      >
        <Row label="Days left">
          <span data-testid="unilateral-exit-eta">
            {blocksLeft === null ? 'almost there' : formatDaysLeft(blocksLeft)}
          </span>
        </Row>
        <div className="border-t border-spark-border/50" />
        <Row label="Processed transactions">
          <Ratio done={progress.confirmed} total={progress.total} />
        </Row>
        <div className="border-t border-spark-border/50" />
        <Row label="Processed sats">
          {/* Only what reached the destination: anything mid-flight is not the
              user's to spend yet. */}
          <Ratio
            done={formatWithSpaces(stages.delivered)}
            total={formatWithSpaces(total)}
          />
        </Row>
        <div className="border-t border-spark-border/50" />
        <Row label="Current status">
          <span data-testid="unilateral-exit-status">{status}</span>
        </Row>
      </div>
    </div>
  );
};

export const TrackerView: React.FC<{
  plan: UnilateralExitPlan;
  tipHeight: number | null;
  isAdvancing: boolean;
  onRebuild: () => void;
}> = ({ plan, tipHeight, isAdvancing, onRebuild }) => {
  const { transactions } = plan.exit;
  const [advanced, setAdvanced] = useState(false);
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
              Rebuild the Exit
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

      <CollapsibleSection
        label="Advanced"
        isVisible={advanced}
        onToggle={() => setAdvanced(v => !v)}
      >
        <BackupActions frozen={plan.exitStateSnapshot}>
          {plan.phase === 'active' && (
            <ExitActionRow
              label="Rebuild at a higher fee"
              onClick={onRebuild}
              testId="unilateral-exit-bump-fee"
            />
          )}
        </BackupActions>
      </CollapsibleSection>
    </div>
  );
};
