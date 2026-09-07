import { nextAction, planProgress } from './driver';
import React from 'react';
import { ChevronRightIcon, LifebuoyIcon } from '@/components/Icons';
import { formatBlockWait } from '@/utils/blockTime';
import { useUnilateralExitEngineState } from './hooks/useUnilateralExitEngineLifecycle';

export const UnilateralExitBanner: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const engine = useUnilateralExitEngineState();

  if (!engine.plan || engine.plan.phase === 'complete') return null;
  const needsRebuild = engine.plan.phase === 'redo';

  const progress = planProgress(engine.plan);
  const blocks =
    engine.tipHeight === null ? null : (nextAction(engine.plan.exit.transactions, engine.tipHeight)?.blocks ?? null);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center justify-between w-full px-4 py-3 bg-spark-warn-surface border border-spark-warn-border rounded-xl text-left transition-colors hover:bg-white/5"
    >
      <div className="flex items-center gap-3 min-w-0">
        <LifebuoyIcon size="md" className="text-spark-primary shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-spark-warn-title">
            {needsRebuild ? 'Unilateral exit needs rebuilding' : 'Unilateral exit in progress'}
          </div>
          <div className="text-xs text-spark-warn-text truncate">
            {needsRebuild
              ? 'The chain moved on. Open to rebuild it.'
              : `${progress.confirmed} of ${progress.total} steps confirmed${
                  blocks === null ? '' : `, next ${formatBlockWait(blocks)}`
                }`}
          </div>
        </div>
      </div>
      <ChevronRightIcon size="md" className="text-spark-primary shrink-0" />
    </button>
  );
};
