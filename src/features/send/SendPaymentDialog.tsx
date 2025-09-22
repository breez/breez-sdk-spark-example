import React, { useState, useEffect } from 'react';
import { DialogHeader, StepContainer, StepContent, BottomSheetContainer, BottomSheetCard } from '../../components/ui';
import { useWallet } from '../../contexts/WalletContext';
// No fee UI in generic amount step; BTC fee selection is handled inside Bitcoin workflow

// External components
import InputStep from './steps/InputStep';
import Bolt11Workflow from './workflows/Bolt11Workflow';
import BitcoinWorkflow from './workflows/BitcoinWorkflow';
import SparkWorkflow from './workflows/SparkWorkflow';
import LnurlWorkflow from './workflows/LnurlWorkflow';
import AmountStep from './steps/AmountStep';
import ProcessingStep from './steps/ProcessingStep';
import ResultStep from './steps/ResultStep';
import { SendInput } from '@/types/domain';
import { LnurlPayRequestDetails, PrepareLnurlPayRequest } from '@breeztech/breez-sdk-spark';

// Props interfaces
interface SendPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialPaymentInput?: SendInput | null;
}

// Main component
const SendPaymentDialog: React.FC<SendPaymentDialogProps> = ({ isOpen, onClose, initialPaymentInput }) => {
  const wallet = useWallet();
  // Container state: input parsing + routing to workflow per input type
  const [currentStep, setCurrentStep] = useState<'input' | 'amount' | 'workflow' | 'processing' | 'result'>('input');
  const [paymentInput, setPaymentInput] = useState<SendInput | null>(null);
  const [amount, setAmount] = useState<string>('');
  // Fee selection moved into Bitcoin workflow
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prepareResponse, setPrepareResponse] = useState<import('@breeztech/breez-sdk-spark').PrepareSendPaymentResponse | null>(null);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failure' | null>(null);

  // Reset state when dialog opens, or process initial data
  useEffect(() => {
    resetState();
    if (isOpen) {

      // If we have initial parsed data from QR scan, process it immediately
      if (initialPaymentInput) {
        setPaymentInput(initialPaymentInput);
        processPaymentInput(initialPaymentInput.rawInput);
      }
    }
  }, [isOpen, initialPaymentInput]);

  const resetState = () => {
    setCurrentStep('input');
    setPaymentInput(null);
    setAmount('');
    setPrepareResponse(null);
    setError(null);
    setIsLoading(false);
  };

  // Unified payment processing function
  const processPaymentInput = async (input: string | null = null) => {
    const currentInput = (input || paymentInput?.rawInput)?.trim();
    if (!currentInput) {
      setError('Please enter a payment destination');
      return;
    }


    setIsLoading(true);
    setError(null);

    try {
      // First, use sdk.parse to determine the input type
      const parseResult = await wallet.parseInput(currentInput);
      setPaymentInput({ rawInput: currentInput.trim(), parsedInput: parseResult });
      if (parseResult.type === 'bolt11Invoice' && parseResult.amountMsat && parseResult.amountMsat > 0) {
        const sats = Math.floor(parseResult.amountMsat / 1000);
        setAmount(String(sats));
        await prepareSendPayment(currentInput, sats);
      } else if (parseResult.type === 'bitcoinAddress' || parseResult.type === 'sparkAddress') {
        setCurrentStep('amount');
      } else if (parseResult.type === 'lnurlPay') {
        // Route to LNURL workflow to collect amount and (optional) comment
        setCurrentStep('workflow');
      } else if (parseResult.type === 'lightningAddress') {
        setCurrentStep('workflow');
      } else {
        setError('Invalid payment destination');
        setCurrentStep('input');
      }
    } catch (err) {
      console.error('Failed to parse input:', err);
      setError('Invalid payment destination');
    } finally {
      setIsLoading(false);
    }
  };

  // Common prepare for all input types
  const prepareSendPayment = async (paymentRequest: string, amountSats: number) => {
    if (amountSats <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await wallet.prepareSendPayment({ paymentRequest, amountSats });
      setPrepareResponse(response);
      // Always go to workflow; BTC fee selection happens inside the Bitcoin workflow
      setCurrentStep('workflow');
    } catch (err) {
      console.error('Failed to prepare payment:', err);
      setError(`Failed to prepare payment ${err instanceof Error ? err.message : 'Unknown error'}`);
      setCurrentStep('amount');
    } finally {
      setIsLoading(false);
    }
  };

  const onAmountNext = async (amountNum: number) => {
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setAmount(String(amountNum));
    await prepareSendPayment(paymentInput?.rawInput || '', amountNum);
  };
  const getStepIndex = (step: 'input' | 'amount' | 'workflow' | 'processing' | 'result'): number => {
    const steps: Array<'input' | 'amount' | 'workflow' | 'processing' | 'result'> = [
      'input',
      'amount',
      'workflow',
      'processing',
      'result',
    ];
    return steps.indexOf(step);
  };

  // Get payment method display name
  const getPaymentMethodName = (): string => {
    if (!paymentInput) return '';
    switch (paymentInput.parsedInput.type) {
      case 'bolt11Invoice':
        return 'Lightning Invoice';
      case 'sparkAddress':
        return 'Spark Address';
      case 'bitcoinAddress':
        return 'Bitcoin Address';
      case 'lnurlPay':
        return 'LNURL Pay';
      case 'lightningAddress':
        return 'Lightning Address';
      default:
        return 'Payment';
    }
  };

  // Get dialog title based on current step
  const getDialogTitle = (): string => {
    if (currentStep === 'amount' || currentStep === 'workflow') {
      return getPaymentMethodName();
    }
    return 'Send Payment';
  };

  // Generic send handler: transitions to processing/result with error handling
  const handleSend = async (options?: any) => {
    if (!prepareResponse) return;
    setCurrentStep('processing');
    setIsLoading(true);
    setError(null);
    try {
      await wallet.sendPayment({ prepareResponse, options });
      setPaymentResult('success');
    } catch (err) {
      console.error('Payment failed:', err);
      setError(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPaymentResult('failure');
    } finally {
      setIsLoading(false);
      setCurrentStep('result');
    }
  };

  // Generic runner for flows like LNURL Pay where the workflow provides the operation
  const handleRun = async (runner: () => Promise<void>) => {
    setCurrentStep('processing');
    setIsLoading(true);
    setError(null);
    try {
      await runner();
      setPaymentResult('success');
    } catch (err) {
      console.error('Operation failed:', err);
      setError(`Operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPaymentResult('failure');
    } finally {
      setIsLoading(false);
      setCurrentStep('result');
    }
  };

  const getLnurlPayRequestDetails = (): LnurlPayRequestDetails | null => {
    if (paymentInput && paymentInput.parsedInput.type === 'lnurlPay') {
      return paymentInput.parsedInput;
    }
    if (paymentInput && paymentInput.parsedInput.type === 'lightningAddress') {
      return paymentInput.parsedInput.payRequest;
    }
    return null;
  };

  return (
    <BottomSheetContainer isOpen={isOpen} onClose={onClose}>
      <BottomSheetCard className="bottom-sheet-card">
        <DialogHeader title={getDialogTitle()} onClose={onClose} />

        <StepContainer>
          {/* Input Step */}
          <StepContent isActive={currentStep === 'input'} isLeft={getStepIndex('input') < getStepIndex(currentStep)}>
            <InputStep
              paymentInput={paymentInput?.rawInput || ''}
              isLoading={isLoading}
              error={error}
              onContinue={(paymentInput) => processPaymentInput(paymentInput)}
            />
          </StepContent>

          {/* Amount Step (common) */}
          <StepContent isActive={currentStep === 'amount'} isLeft={getStepIndex('amount') < getStepIndex(currentStep)}>
            <AmountStep
              paymentInput={paymentInput?.rawInput || ''}
              amount={amount}
              isLoading={isLoading}
              error={error}
              onBack={() => setCurrentStep('input')}
              onNext={onAmountNext}
            />
          </StepContent>

          {/* Workflow Step: delegates to a specific workflow component */}
          <StepContent isActive={currentStep === 'workflow'} isLeft={getStepIndex('workflow') < getStepIndex(currentStep)}>
            {prepareResponse && prepareResponse.paymentMethod.type === 'bolt11Invoice' && (
              <Bolt11Workflow
                method={prepareResponse.paymentMethod}
                amountSats={prepareResponse.amountSats}
                onBack={() => setCurrentStep('input')}
                onSend={handleSend}
              />
            )}
            {prepareResponse && prepareResponse.paymentMethod.type === 'bitcoinAddress' && (
              <BitcoinWorkflow
                method={prepareResponse.paymentMethod}
                amountSats={prepareResponse.amountSats}
                onBack={() => setCurrentStep('amount')}
                onSend={handleSend}
              />
            )}
            {prepareResponse && prepareResponse.paymentMethod.type === 'sparkAddress' && (
              <SparkWorkflow
                method={prepareResponse.paymentMethod}
                amountSats={prepareResponse.amountSats}
                onBack={() => setCurrentStep('input')}
                onSend={handleSend}
              />
            )}
            {getLnurlPayRequestDetails() && (
              <LnurlWorkflow
                parsed={getLnurlPayRequestDetails()!}
                onBack={() => setCurrentStep('input')}
                onRun={handleRun}
                onPrepare={async (prepareRequest: PrepareLnurlPayRequest) => {
                  return await wallet.prepareLnurlPay(prepareRequest);
                }}
                onPay={async (prepareResponse) => {
                  await wallet.lnurlPay({ prepareResponse });
                }}
              />
            )}
          </StepContent>

          {/* Processing Step (generic) */}
          <StepContent isActive={currentStep === 'processing'} isLeft={getStepIndex('processing') < getStepIndex(currentStep)}>
            <ProcessingStep />
          </StepContent>

          {/* Result Step (generic) */}
          <StepContent isActive={currentStep === 'result'} isLeft={getStepIndex('result') < getStepIndex(currentStep)}>
            <ResultStep result={paymentResult === 'success' ? 'success' : 'failure'} error={error} onClose={onClose} />
          </StepContent>
        </StepContainer>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default SendPaymentDialog;
