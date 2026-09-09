import React, { useEffect, useState } from 'react';
import SlideInPage from '@/components/layout/SlideInPage';
import { ErrorMessageBox, LoadingSpinner, PrimaryButton } from '@/components/ui';
import { PinGate } from '@/components/PinEntry';
import { isPinEnabled } from '@/services/appLock';
import { canContinueFromQuote, useUnilateralExitFlow } from '@/features/unilateral-exit/hooks/useUnilateralExitFlow';
import { IntroStep } from '@/features/unilateral-exit/steps/IntroStep';
import { DestinationStep } from '@/features/unilateral-exit/steps/DestinationStep';
import { FeeStep } from '@/features/unilateral-exit/steps/FeeStep';
import { QuoteStep } from '@/features/unilateral-exit/steps/QuoteStep';
import { FundStep } from '@/features/unilateral-exit/steps/FundStep';
import { TrackerView } from '@/features/unilateral-exit/TrackerView';

interface UnilateralExitPageProps {
  network: string;
  onBack: () => void;
  /** Where to go once the exit lands, since the tracker has nothing left to show. */
  onFinished: () => void;
}

const UnilateralExitPage: React.FC<UnilateralExitPageProps> = ({ network, onBack, onFinished }) => {
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

  // The engine releases the plan as soon as the exit lands, which leaves the
  // tracker with nothing. The wallet list carries it from there.
  const { phase, engine } = flow;
  useEffect(() => {
    if (phase === 'tracker' && !engine.plan) onFinished();
  }, [phase, engine.plan, onFinished]);

  // One call to action per step, in the bar the rest of the app puts it in.
  // A step with nothing to press, such as the pin gate or the build, has none.
  const footer = (() => {
    switch (flow.phase) {
      case 'intro':
        return (
          <PrimaryButton onClick={() => flow.goTo('destination')} className="w-full" data-testid="unilateral-exit-start">
            Continue
          </PrimaryButton>
        );
      case 'destination':
        return (
          <PrimaryButton
            onClick={() => void flow.submitDestination()}
            disabled={!flow.destination.destination.trim()}
            className="w-full"
            data-testid="unilateral-exit-destination-continue"
          >
            Continue
          </PrimaryButton>
        );
      case 'fee':
        return (
          <PrimaryButton
            onClick={() => void flow.submitFee()}
            disabled={flow.fee.effectiveFeeRate <= 0}
            className="w-full"
            data-testid="unilateral-exit-get-quote"
          >
            Get Quote
          </PrimaryButton>
        );
      case 'quote':
        if (!canContinueFromQuote(flow.quote)) return null;
        return (
          <PrimaryButton onClick={() => flow.goTo('unlock')} className="w-full" data-testid="unilateral-exit-quote-continue">
            Continue
          </PrimaryButton>
        );
      case 'fund':
        return (
          <PrimaryButton
            onClick={() => void flow.build()}
            disabled={!flow.funding?.isFunded}
            className="w-full"
            data-testid="unilateral-exit-build"
          >
            Exit Spark
          </PrimaryButton>
        );
      default:
        return null;
    }
  })();

  return (
    <SlideInPage
      title="Unilateral Exit"
      closeStyle="back"
      onClose={onBack}
      onHeaderBack={flow.canGoBack ? flow.back : undefined}
      slideFrom="left"
      footer={footer}
    >
      <div className="p-4">
        <div className="max-w-xl mx-auto w-full">
          {flow.phase === 'intro' && <IntroStep />}

          {flow.phase === 'destination' && (
            <DestinationStep {...flow.destination} />
          )}

          {flow.phase === 'fee' && (
            <FeeStep {...flow.fee} />
          )}

          {flow.phase === 'quote' && (
            <QuoteStep {...flow.quote} />
          )}

          {flow.phase === 'unlock' && (
            <div className="space-y-6">
              {gate === 'pin' && (
                <PinGate reason="Unilateral exit" onUnlocked={() => void flow.unlock()} />
              )}
              {flow.unlockError && (
                <ErrorMessageBox title="Cannot reach your recovery phrase" error={flow.unlockError} />
              )}
            </div>
          )}

          {flow.phase === 'fund' && flow.funding && (
            <FundStep {...flow.funding} error={flow.buildError} />
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
            />
          )}
        </div>
      </div>
    </SlideInPage>
  );
};

export default UnilateralExitPage;
