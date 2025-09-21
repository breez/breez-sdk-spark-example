import React from 'react';
import { PrimaryButton, ResultIcon, ResultMessage } from '../../../components/ui';

export interface ResultStepProps {
  result: 'success' | 'failure';
  error: string | null;
  onClose: () => void;
}

const ResultStep: React.FC<ResultStepProps> = ({ result, error, onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <ResultIcon type={result} />
      <ResultMessage
        title={result === 'success' ? 'Payment Successful!' : 'Payment Failed'}
        description={result === 'success' ? 'Your payment has been sent successfully.' : error || 'There was an error processing your payment.'}
      />
      <PrimaryButton onClick={onClose} className="mt-6">
        Close
      </PrimaryButton>
    </div>
  );
};

export default ResultStep;
