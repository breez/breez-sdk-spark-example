import React, { useState, useEffect } from 'react';
import * as walletService from '../services/walletService';
import LoadingSpinner from './LoadingSpinner';
import {
  DialogHeader, FormGroup,
  FormInput, FormError, PrimaryButton,
  QRCodeContainer, CopyableText, Alert, StepContainer, BottomSheetCard, BottomSheetContainer
} from './ui';

// Types
type ReceiveStep = 'loading_limits' | 'input' | 'qr' | 'loading';

// Props interfaces
interface ReceivePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  walletService: typeof walletService;
}

interface InputFormProps {
  description: string;
  setDescription: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  minAmount: number;
  maxAmount: number;
  error: string | null;
  isLoading: boolean;
  onSubmit: () => void;
}

interface QRCodeDisplayProps {
  invoice: string;
  feeSats: number;
  onClose: () => void;
}

// Component to display limits and form for receiving payment
const InputForm: React.FC<InputFormProps> = ({
  description,
  setDescription,
  amount,
  setAmount,
  minAmount,
  maxAmount,
  error,
  isLoading,
  onSubmit
}) => {
  const formatSats = (sats: number): string => {
    return sats?.toLocaleString();
  };

  return (
    <FormGroup>


      <FormGroup className="pt-2">
        <div>
          <FormInput
            id="amount"
            type="number"
            min={minAmount}
            max={maxAmount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in sats"
            disabled={isLoading}
          />
        </div>

        <div>
          <FormInput
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            disabled={isLoading}
          />
        </div>

        <FormError error={error} />
      </FormGroup>

      <div className="mt-6 flex justify-center">
        <PrimaryButton
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner text="Processing..." size="small" />
          ) : 'Create'}
        </PrimaryButton>
      </div>
    </FormGroup>
  );
};

// Component to display QR code with invoice
const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ invoice, feeSats }) => {
  return (
    <div className="pt-8 space-y-6 flex flex-col items-center">

      <QRCodeContainer value={invoice} />

      <div className="w-full">
        <CopyableText text={invoice} />

        {feeSats > 0 && (
          <Alert type="warning" className="mt-8">
            <center>A fee of {feeSats} sats is applied to this invoice.</center>
          </Alert>
        )}
      </div>
    </div>
  );
};

// Main component
const ReceivePaymentDialog: React.FC<ReceivePaymentDialogProps> = ({ isOpen, onClose, walletService }) => {
  // State
  const [currentStep, setCurrentStep] = useState<ReceiveStep>('loading_limits');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [invoice, setInvoice] = useState<string>('');
  const [feeSats, setFeeSats] = useState<number>(0);
  const [limits, setLimits] = useState<{ min: number, max: number }>({ min: 1, max: 1000000 });



  // Reset state when dialog opens and set default limits
  useEffect(() => {
    if (isOpen) {
      resetState();
      setDefaultLimits();
    }
  }, [isOpen]);

  const resetState = () => {
    setCurrentStep('loading_limits');
    setDescription('');
    setAmount('');
    setError(null);
    setIsLoading(false);
    setInvoice('');
    setFeeSats(0);
  };

  // Set default limits since fetchLightningLimits is not available in new API
  const setDefaultLimits = async () => {
    try {
      // Set reasonable default limits for receiving lightning payments
      setLimits({
        min: 1000, // 1000 sats minimum
        max: 10000000 // 10M sats maximum
      });

      // Move to input step after setting limits
      setCurrentStep('input');
    } catch (err) {
      console.error('Failed to set default limits:', err);
      setError('Failed to set payment limits. Please try again.');
      setCurrentStep('input');
    }
  };

  // Generate lightning invoice
  const generateInvoice = async () => {
    // Validate amount
    const amountSats = parseInt(amount);
    if (isNaN(amountSats)) {
      setError(`Amount must be a valid number`);
      return;
    }

    setError(null);
    setIsLoading(true);
    setCurrentStep('loading');

    try {
      // Generate lightning invoice using walletService
      const prepareResponse = await walletService.prepareReceivePayment({
        paymentMethod: {
          type: 'bolt11Invoice',
          description: description,
          amountSats: amountSats
        }
      });
      const receiveResponse = await walletService.receivePayment({
        prepareResponse: prepareResponse
      });
      // Set invoice and fees
      setInvoice(receiveResponse.paymentRequest);
      setFeeSats(prepareResponse.feeSats || 0);
      setCurrentStep('qr');
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      setError(`Failed to generate invoice: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setCurrentStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheetContainer isOpen={isOpen} onClose={onClose} >
      <BottomSheetCard className="bottom-sheet-card">
        <DialogHeader title="Receive Payment" onClose={onClose} />

        <StepContainer>
          {currentStep === 'loading_limits' && (
            <div className="flex flex-col items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          )}

          {currentStep === 'input' && (
            <InputForm
              description={description}
              setDescription={setDescription}
              amount={amount}
              setAmount={setAmount}
              minAmount={limits.min}
              maxAmount={limits.max}
              error={error}
              isLoading={isLoading}
              onSubmit={generateInvoice}
            />
          )}

          {currentStep === 'loading' && (
            <div className="flex flex-col items-center justify-center h-40">
              <LoadingSpinner text="Generating invoice..." />
            </div>
          )}

          {currentStep === 'qr' && (
            <QRCodeDisplay
              invoice={invoice}
              feeSats={feeSats}
              onClose={onClose}
            />
          )}
        </StepContainer>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default ReceivePaymentDialog;
