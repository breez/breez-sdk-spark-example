import React, { useState } from 'react';
import type { SendPaymentMethod } from '@breeztech/breez-sdk-spark';
import type { PaymentStep } from '../../../types/domain';
import { StepContainer, StepContent } from '../../../components/ui';
import ConfirmStep from '../steps/ConfirmStep';
import ProcessingStep from '../steps/ProcessingStep';
import ResultStep from '../steps/ResultStep';

interface SparkWorkflowProps {
  method: Extract<SendPaymentMethod, { type: 'sparkAddress' }>;
  amountSats: number;
  onBack: () => void;
  onSend: (options?: any) => Promise<void>;
}

type PaymentResult = 'success' | 'failure' | null;

const SparkWorkflow: React.FC<SparkWorkflowProps> = ({ method, amountSats, onBack, onSend }) => {
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
      await onSend();
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

  // Spark transfers currently have no extra fee exposed on the prepared method
  // Reference method.type to satisfy noUnusedLocals and keep future extensibility
  const feesSat: number | null = method.type === 'sparkAddress' ? null : null;

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

export default SparkWorkflow;
