import React, { useState, useEffect } from 'react';
import { DialogHeader, StepContainer, StepContent, BottomSheetContainer, BottomSheetCard } from '../../components/ui';
import { useWallet } from '../../contexts/WalletContext';
import { InputType } from '@breeztech/breez-sdk-spark';
// No fee UI in generic amount step; BTC fee selection is handled inside Bitcoin workflow

// External components
import InputStep from './steps/InputStep';
import Bolt11Workflow from './workflows/Bolt11Workflow';
import BitcoinWorkflow from './workflows/BitcoinWorkflow';
import SparkWorkflow from './workflows/SparkWorkflow';
import AmountStep from './steps/AmountStep';

// Props interfaces
interface SendPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialPaymentInput?: string | null;
}

// Main component
const SendPaymentDialog: React.FC<SendPaymentDialogProps> = ({ isOpen, onClose, initialPaymentInput }) => {
  const wallet = useWallet();
  // Container state: input parsing + routing to workflow per input type
  const [currentStep, setCurrentStep] = useState<'input' | 'amount' | 'workflow'>('input');
  const [paymentInput, setPaymentInput] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  // Fee selection moved into Bitcoin workflow
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parsedInput, setParsedInput] = useState<InputType | null>(null);
  const [prepareResponse, setPrepareResponse] = useState<import('@breeztech/breez-sdk-spark').PrepareSendPaymentResponse | null>(null);

  // Reset state when dialog opens, or process initial data
  useEffect(() => {
    if (isOpen) {
      resetState();

      // If we have initial parsed data from QR scan, process it immediately
      if (initialPaymentInput) {
        setPaymentInput(initialPaymentInput);
        processPaymentInput(initialPaymentInput);
      }
    }
  }, [isOpen, initialPaymentInput]);

  const resetState = () => {
    setCurrentStep('input');
    setPaymentInput('');
    setAmount('');
    // reset fee-related state (handled in BTC workflow)
    setParsedInput(null);
    setPrepareResponse(null);
    setError(null);
    setIsLoading(false);
  };

  // Unified payment processing function
  const processPaymentInput = async (input: string | null = null) => {
    const currentInput = input || paymentInput;
    if (!currentInput.trim()) {
      setError('Please enter a payment destination');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, use sdk.parse to determine the input type
      const parseResult = await wallet.parseInput(currentInput.trim());
      setParsedInput(parseResult);
      if (parseResult.type === 'bolt11Invoice' && parseResult.amountMsat && parseResult.amountMsat > 0) {
        const sats = Math.floor(parseResult.amountMsat / 1000);
        setAmount(String(sats));
        await prepareSendPayment(currentInput, sats);
      } else if (parseResult.type === 'bitcoinAddress' || parseResult.type === 'sparkAddress') {
        setCurrentStep('amount');
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
      setError('Failed to prepare payment');
      setCurrentStep('amount');
    } finally {
      setIsLoading(false);
    }
  };

  const onAmountNext = async () => {
    if (!parsedInput) return;
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    await prepareSendPayment(paymentInput, amountNum);
  };
  const getStepIndex = (step: 'input' | 'amount' | 'workflow'): number => {
    const steps: Array<'input' | 'amount' | 'workflow'> = ['input', 'amount', 'workflow'];
    return steps.indexOf(step);
  };

  // Get payment method display name
  const getPaymentMethodName = (): string => {
    if (!parsedInput) return '';
    switch (parsedInput.type) {
      case 'bolt11Invoice':
        return 'Lightning Invoice';
      case 'sparkAddress':
        return 'Spark Address';
      case 'bitcoinAddress':
        return 'Bitcoin Address';
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

  return (
    <BottomSheetContainer isOpen={isOpen} onClose={onClose}>
      <BottomSheetCard className="bottom-sheet-card">
        <DialogHeader title={getDialogTitle()} onClose={onClose} />

        <StepContainer>
          {/* Input Step */}
          <StepContent isActive={currentStep === 'input'} isLeft={getStepIndex('input') < getStepIndex(currentStep)}>
            <InputStep
              paymentInput={paymentInput}
              setPaymentInput={setPaymentInput}
              isLoading={isLoading}
              error={error}
              onContinue={processPaymentInput}
            />
          </StepContent>

          {/* Amount Step (common) */}
          <StepContent isActive={currentStep === 'amount'} isLeft={getStepIndex('amount') < getStepIndex(currentStep)}>
            <AmountStep
              paymentInput={paymentInput}
              amount={amount}
              setAmount={setAmount}
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
                onSend={async (options: any) => {
                  await wallet.sendPayment({ prepareResponse, options });
                }}
              />
            )}
            {prepareResponse && prepareResponse.paymentMethod.type === 'bitcoinAddress' && (
              <BitcoinWorkflow
                method={prepareResponse.paymentMethod}
                amountSats={prepareResponse.amountSats}
                onBack={() => setCurrentStep('amount')}
                onSend={async (options: any) => {
                  await wallet.sendPayment({ prepareResponse, options });
                }}
              />
            )}
            {prepareResponse && prepareResponse.paymentMethod.type === 'sparkAddress' && (
              <SparkWorkflow
                method={prepareResponse.paymentMethod}
                amountSats={prepareResponse.amountSats}
                onBack={() => setCurrentStep('input')}
                onSend={async () => {
                  await wallet.sendPayment({ prepareResponse });
                }}
              />
            )}
          </StepContent>
        </StepContainer>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default SendPaymentDialog;
