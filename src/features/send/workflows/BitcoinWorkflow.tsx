import React, { useState } from 'react';
import type { SendPaymentMethod } from '@breeztech/breez-sdk-spark';
import type { PaymentStep } from '../../../types/domain';
import { StepContainer, StepContent } from '../../../components/ui';
import ConfirmStep from '../steps/ConfirmStep';
import ProcessingStep from '../steps/ProcessingStep';
import ResultStep from '../steps/ResultStep';

interface BitcoinWorkflowProps {
  method: Extract<SendPaymentMethod, { type: 'bitcoinAddress' }>;
  amountSats: number;
  onBack: () => void;
  onSend: (options: { type: 'bitcoinAddress'; confirmationSpeed: 'fast' | 'medium' | 'slow' }) => Promise<void>;
}

type PaymentResult = 'success' | 'failure' | null;

const BitcoinWorkflow: React.FC<BitcoinWorkflowProps> = ({ method, amountSats, onBack, onSend }) => {
  const [step, setStep] = useState<PaymentStep>('fee');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult>(null);
  const [selectedFeeRate, setSelectedFeeRate] = useState<'fast' | 'medium' | 'slow' | null>(null);

  const getStepIndex = (s: PaymentStep) => {
    const order: PaymentStep[] = ['amount', 'confirm', 'processing', 'result'];
    return order.indexOf(s);
  };

  const handleSend = async () => {
    if (!selectedFeeRate) return;
    setStep('processing');
    setIsLoading(true);
    try {
      await onSend({ type: 'bitcoinAddress', confirmationSpeed: selectedFeeRate });
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

  // Compute fees from prepared response and selected rate
  const fq = method.feeQuote;
  let feesSat: number | null = null;
  if (selectedFeeRate) {
    const selected = selectedFeeRate === 'fast' ? fq.speedFast : selectedFeeRate === 'medium' ? fq.speedMedium : fq.speedSlow;
    feesSat = selected.l1BroadcastFeeSat + selected.userFeeSat;
  }

  return (
    <StepContainer>
      {/* Fee selection */}
      <StepContent isActive={step === 'fee'} isLeft={false}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-white))] mb-2">Select Fee Rate</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedFeeRate('slow')}
              disabled={isLoading}
              className={`relative p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedFeeRate === 'slow'
                  ? 'bg-[rgb(var(--primary-blue))] text-white border-[rgb(var(--primary-blue))] ring-2 ring-[rgb(var(--primary-blue))]'
                  : 'bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] border-[rgb(var(--card-border))] hover:border-[rgb(var(--primary-blue))]'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedFeeRate === 'slow' && (
                <svg className="absolute top-2 right-2 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <div>Slow</div>
              <div className="text-xs opacity-70">{fq.speedSlow.l1BroadcastFeeSat + fq.speedSlow.userFeeSat} sats</div>
            </button>
            <button
              onClick={() => setSelectedFeeRate('medium')}
              disabled={isLoading}
              className={`relative p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedFeeRate === 'medium'
                  ? 'bg-[rgb(var(--primary-blue))] text-white border-[rgb(var(--primary-blue))] ring-2 ring-[rgb(var(--primary-blue))]'
                  : 'bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] border-[rgb(var(--card-border))] hover:border-[rgb(var(--primary-blue))]'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedFeeRate === 'medium' && (
                <svg className="absolute top-2 right-2 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <div>Medium</div>
              <div className="text-xs opacity-70">{fq.speedMedium.l1BroadcastFeeSat + fq.speedMedium.userFeeSat} sats</div>
            </button>
            <button
              onClick={() => setSelectedFeeRate('fast')}
              disabled={isLoading}
              className={`relative p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedFeeRate === 'fast'
                  ? 'bg-[rgb(var(--primary-blue))] text-white border-[rgb(var(--primary-blue))] ring-2 ring-[rgb(var(--primary-blue))]'
                  : 'bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] border-[rgb(var(--card-border))] hover:border-[rgb(var(--primary-blue))]'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedFeeRate === 'fast' && (
                <svg className="absolute top-2 right-2 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <div>Fast</div>
              <div className="text-xs opacity-70">{fq.speedFast.l1BroadcastFeeSat + fq.speedFast.userFeeSat} sats</div>
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onBack} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg" disabled={isLoading}>
            Back
          </button>
          <button
            onClick={() => setStep('confirm')}
            className="flex-1 bg-[rgb(var(--primary-blue))] hover:bg-[rgb(var(--secondary-blue))] text-white p-3 rounded-lg"
            disabled={isLoading || !selectedFeeRate}
          >
            Continue
          </button>
        </div>
      </StepContent>
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

export default BitcoinWorkflow;
