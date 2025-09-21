import React, { useState } from 'react';
import type { SendPaymentMethod } from '@breeztech/breez-sdk-spark';
import type { PaymentStep } from '../../../types/domain';
import { StepContainer, StepContent } from '../../../components/ui';
import ConfirmStep from '../steps/ConfirmStep';
import ProcessingStep from '../steps/ProcessingStep';
import ResultStep from '../steps/ResultStep';

interface Bolt11WorkflowProps {
  method: Extract<SendPaymentMethod, { type: 'bolt11Invoice' }>;
  amountSats: number;
  onBack: () => void;
  onSend: (options: { type: 'bolt11Invoice'; useSpark: boolean }) => Promise<void>;
}

type PaymentResult = 'success' | 'failure' | null;

const Bolt11Workflow: React.FC<Bolt11WorkflowProps> = ({ method, amountSats, onBack, onSend }) => {
  const [step, setStep] = useState<PaymentStep>('confirm');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult>(null);

  const getStepIndex = (s: PaymentStep) => {
    const order: PaymentStep[] = ['amount', 'confirm', 'processing', 'result'];
    return order.indexOf(s);
  };

  const handleSend = async () => {
    setStep('processing');
    setIsLoading(true);
    try {
      const useSpark = method.sparkTransferFeeSats != null;
      await onSend({ type: 'bolt11Invoice', useSpark });
      setResult('success');
    } catch (err) {
      console.error('Payment failed:', err);
      setError(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setResult('failure');
    } finally {
      setIsLoading(false);
      setStep('result');
    }
  };

  // Compute display fees from prepared response
  let feesSat: number | null = null;
  if (method.sparkTransferFeeSats != null) {
    feesSat = method.sparkTransferFeeSats;
  } else if (method.lightningFeeSats != null) {
    feesSat = method.lightningFeeSats;
  }

  return (
    <StepContainer>
      {/* Confirm */}
      <StepContent isActive={step === 'confirm'} isLeft={getStepIndex('confirm') < getStepIndex(step)}>
        <ConfirmStep amountSats={amountSats} feesSat={feesSat} error={error} isLoading={isLoading} onConfirm={handleSend} />
      </StepContent>

      {/* Processing */}
      <StepContent isActive={step === 'processing'} isLeft={getStepIndex('processing') < getStepIndex(step)}>
        <ProcessingStep />
      </StepContent>

      {/* Result */}
      <StepContent isActive={step === 'result'} isLeft={getStepIndex('result') < getStepIndex(step)}>
        <ResultStep result={result === 'success' ? 'success' : 'failure'} error={error} onClose={onBack} />
      </StepContent>
    </StepContainer>
  );
};

export default Bolt11Workflow;
