import React, { useCallback, useEffect, useState } from 'react';
import {
  BottomSheetCard,
  BottomSheetContainer,
  DialogHeader,
  ErrorMessageBox,
  LoadingSpinner,
  PrimaryButton,
} from '@/components/ui';
import { PinGate } from '@/components/PinEntry';
import QrScannerDialog from '@/components/QrScannerDialog';
import { useBackButton } from '@/hooks/useBackButton';
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
  const [isScanning, setIsScanning] = useState(false);
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
  const { canGoBack, back } = flow;
  useBackButton(
    useCallback(() => {
      if (!canGoBack) return false;
      back();
      return true;
    }, [canGoBack, back]),
    true,
  );

  const stepAction = (() => {
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
    <>
      {/* Above the settings page's z-60 wrapper: the sheet portals to #root as
          its sibling, so at the default z-50 it opens behind that page. */}
      <BottomSheetContainer isOpen onClose={onBack} zIndex={70} showBackdrop>
        <BottomSheetCard>
          <DialogHeader
            // Names the flow, not the step: each step already labels its own
            // field, and the send sheet titles itself the same way.
            title="Unilateral Exit"
            onClose={onBack}
            onBack={flow.canGoBack ? flow.back : undefined}
          />

          {/* Bounded so the sheet stays content-sized: past 90% of the
              viewport the container drops the content snap and the sheet
              rests almost closed. dvh, not vh, or the cap overflows once a
              mobile URL bar is showing. The action is a sibling of the
              scroller, not inside it: a sheet cannot pin a footer at a
              partial snap, and a CTA that scrolls away is one to hunt for.
              The nested scroller needs its own overscroll and touch rules,
              which it does not inherit. */}
          <div className="flex flex-col max-h-[70dvh]">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-none touch-pan-y space-y-6">
            {flow.phase === 'intro' && <IntroStep />}

            {flow.phase === 'destination' && (
              <DestinationStep
                {...flow.destination}
                onSubmit={() => void flow.submitDestination()}
                onScanQr={() => setIsScanning(true)}
              />
            )}

            {flow.phase === 'fee' && <FeeStep {...flow.fee} />}

            {flow.phase === 'quote' && <QuoteStep {...flow.quote} />}

            {flow.phase === 'unlock' && (
              <>
                {gate === 'pin' && (
                  <PinGate reason="Unilateral exit" onUnlocked={() => void flow.unlock()} />
                )}
                {flow.unlockError && (
                  <ErrorMessageBox title="Cannot reach your recovery phrase" error={flow.unlockError} />
                )}
              </>
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

            {stepAction && <div className="shrink-0 pt-6">{stepAction}</div>}
          </div>
        </BottomSheetCard>
      </BottomSheetContainer>

      {/* Over the exit sheet, which is itself over the page. */}
      <QrScannerDialog
        isOpen={isScanning}
        zIndex={80}
        onClose={() => setIsScanning(false)}
        onScan={scanned => {
          flow.destination.onChange(scanned.trim());
          setIsScanning(false);
        }}
      />
    </>
  );
};

export default UnilateralExitPage;
