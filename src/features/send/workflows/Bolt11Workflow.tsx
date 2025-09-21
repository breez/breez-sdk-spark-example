import React from 'react';
import type { SendPaymentMethod } from '@breeztech/breez-sdk-spark';
import ConfirmStep from '../steps/ConfirmStep';

interface Bolt11WorkflowProps {
  method: Extract<SendPaymentMethod, { type: 'bolt11Invoice' }>;
  amountSats: number;
  onBack: () => void;
  onSend: (options: { type: 'bolt11Invoice'; useSpark: boolean }) => Promise<void>;
}

const Bolt11Workflow: React.FC<Bolt11WorkflowProps> = ({ method, amountSats, onSend }) => {
  const handleSend = () => {
    const useSpark = method.sparkTransferFeeSats != null;
    return onSend({ type: 'bolt11Invoice', useSpark });
  };

  // Compute display fees from prepared response
  let feesSat: number | null = null;
  if (method.sparkTransferFeeSats != null) {
    feesSat = method.sparkTransferFeeSats;
  } else if (method.lightningFeeSats != null) {
    feesSat = method.lightningFeeSats;
  }

  return <ConfirmStep amountSats={amountSats} feesSat={feesSat} error={null} isLoading={false} onConfirm={handleSend} />;
};

export default Bolt11Workflow;
