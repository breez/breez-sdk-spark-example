import React, { useEffect, useState } from 'react';
import SlideInPage from '@/components/layout/SlideInPage';
import { ErrorMessageBox, LoadingSpinner, SecondaryButton } from '@/components/ui';
import { PinGate } from '@/components/PinEntry';
import { isPinEnabled } from '@/services/appLock';
import { useUnilateralExitFlow } from '@/features/unilateral-exit/hooks/useUnilateralExitFlow';
import { IntroStep } from '@/features/unilateral-exit/steps/IntroStep';
import { DestinationStep } from '@/features/unilateral-exit/steps/DestinationStep';
import { FeeStep } from '@/features/unilateral-exit/steps/FeeStep';
import { QuoteStep } from '@/features/unilateral-exit/steps/QuoteStep';
import { FundStep } from '@/features/unilateral-exit/steps/FundStep';
import { ConfirmStep } from '@/features/unilateral-exit/steps/ConfirmStep';
import { TrackerView } from '@/features/unilateral-exit/TrackerView';
import { dismissUnilateralExitPlan } from '@/features/unilateral-exit/engine';

interface UnilateralExitPageProps {
  network: string;
  onBack: () => void;
}

const UnilateralExitPage: React.FC<UnilateralExitPageProps> = ({ network, onBack }) => {
  const flow = useUnilateralExitFlow(network);

  // Reading the recovery phrase is gated on a PIN where one is set. Where none
  // is, the step passes straight through.
  const { unlock } = flow;
  const [gate, setGate] = useState<'pin' | null>(null);
  useEffect(() => {
    if (flow.phase !== 'unlock') return;
    let cancelled = false;
    void isPinEnabled().then(enabled => {
      if (cancelled) return;
      if (enabled) setGate('pin');
      else void unlock();
    });
    return () => {
      cancelled = true;
    };
  }, [flow.phase, unlock]);

  return (
    <SlideInPage title="Unilateral exit" onClose={onBack} slideFrom="left">
      <div className="p-4">
        <div className="max-w-xl mx-auto w-full">
          {flow.phase === 'intro' && <IntroStep onContinue={() => flow.goTo('destination')} />}

          {flow.phase === 'destination' && (
            <DestinationStep
              {...flow.destination}
              onBack={flow.back}
              onContinue={() => void flow.submitDestination()}
            />
          )}

          {flow.phase === 'fee' && (
            <FeeStep {...flow.fee} onBack={flow.back} onContinue={() => void flow.submitFee()} />
          )}

          {flow.phase === 'quote' && (
            <QuoteStep {...flow.quote} onBack={flow.back} onContinue={() => flow.goTo('unlock')} />
          )}

          {flow.phase === 'unlock' && (
            <div className="space-y-6">
              {gate === 'pin' && (
                <PinGate reason="Unilateral exit" onUnlocked={() => void flow.unlock()} />
              )}
              {flow.unlockError && (
                <ErrorMessageBox title="Cannot reach your recovery phrase" error={flow.unlockError} />
              )}
              <SecondaryButton onClick={flow.back} className="w-full">
                Back
              </SecondaryButton>
            </div>
          )}

          {flow.phase === 'fund' && flow.funding && (
            <FundStep {...flow.funding} onBack={flow.back} onContinue={() => flow.goTo('confirm')} />
          )}

          {flow.phase === 'confirm' && flow.quote.quote && flow.funding && (
            <ConfirmStep
              quote={flow.quote.quote}
              sweepFeeSat={flow.quote.sweepFeeSat}
              willReceiveSat={flow.quote.willReceiveSat}
              fundedSat={flow.funding.fundedSat}
              error={flow.buildError}
              onBack={flow.back}
              onBuild={() => void flow.build()}
            />
          )}

          {flow.phase === 'building' && (
            <div className="py-16 flex flex-col items-center justify-center gap-4">
              <LoadingSpinner text="Building and signing the exit..." />
              <p className="text-spark-text-muted text-xs text-center">
                Keep this window open until it finishes.
              </p>
            </div>
          )}

          {flow.phase === 'tracker' && flow.engine.plan && (
            <TrackerView
              plan={flow.engine.plan}
              tipHeight={flow.engine.tipHeight}
              isAdvancing={flow.engine.isAdvancing}
              onRebuild={flow.rebuild}
              onDone={() => {
                dismissUnilateralExitPlan();
                onBack();
              }}
            />
          )}
        </div>
      </div>
    </SlideInPage>
  );
};

export default UnilateralExitPage;
