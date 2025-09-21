import React, { useState, useEffect } from 'react';
import {
  DialogHeader,
  StepContainer,
  StepContent,
  BottomSheetContainer,
  BottomSheetCard,
  FormGroup,
  FormError,
  PrimaryButton,
  PaymentInfoCard,
  PaymentInfoRow,
  PaymentInfoDivider,
  ResultIcon,
  ResultMessage,
  FormDescription,
  LoadingSpinner
} from './ui';
import { useWallet } from '../contexts/WalletContext';
import { Bolt11InvoiceDetails, PrepareSendPaymentResponse, InputType } from '@breeztech/breez-sdk-spark';

// Types
import type { PaymentStep, FeeOptions } from '../types/domain';
import { BITCOIN_FEE_PRESETS } from '../constants/fees';
type PaymentResult = 'success' | 'failure' | null;

// Fee options interface moved to shared types

// Props interfaces
interface SendPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialParsedData?: InputType | null;
}

interface ConfirmStepProps {
  amountSats: number | null;
  feesSat: number | null;
  error: string | null;
  isLoading: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

interface AmountStepProps {
  paymentMethod: string;
  paymentInput: string;
  amount: string;
  setAmount: (value: string) => void;
  selectedFeeRate: 'fast' | 'medium' | 'slow' | null;
  setSelectedFeeRate: (rate: 'fast' | 'medium' | 'slow') => void;
  feeOptions: FeeOptions | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
}

interface ResultStepProps {
  result: 'success' | 'failure';
  error: string | null;
  onClose: () => void;
}

// Amount Step Component
const AmountStep: React.FC<AmountStepProps> = ({
  paymentMethod,
  paymentInput,
  amount,
  setAmount,
  selectedFeeRate,
  setSelectedFeeRate,
  feeOptions,
  isLoading,
  error,
  onBack,
  onNext,
}) => {
  const needsFeeSelection = paymentMethod === 'Bitcoin Address' && feeOptions;

  return (
    <FormGroup>
      <div className="text-center mb-6">
        <FormDescription>
          Enter the amount you want to send
        </FormDescription>
      </div>

      {/* Show the payment destination */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[rgb(var(--text-white))] mb-2">
          Payment Destination
        </label>
        <div className="p-3 bg-[rgb(var(--card-border))] rounded-lg">
          <code className="text-sm text-[rgb(var(--text-white))] break-all">
            {paymentInput}
          </code>
        </div>
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[rgb(var(--text-white))] mb-2">
          Amount (sats)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount in satoshis"
          className="w-full p-3 border border-[rgb(var(--card-border))] rounded-lg bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] placeholder-[rgb(var(--text-white))] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-blue))]"
          disabled={isLoading}
          min={1}
        />
      </div>

      {/* Fee selection for Bitcoin addresses */}
      {needsFeeSelection && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-white))] mb-2">
            Fee Rate
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedFeeRate('slow')}
              disabled={isLoading}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${selectedFeeRate === 'slow'
                ? 'bg-[rgb(var(--primary-blue))] text-white border-[rgb(var(--primary-blue))]'
                : 'bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] border-[rgb(var(--card-border))] hover:border-[rgb(var(--primary-blue))]'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>Slow</div>
              <div className="text-xs opacity-70">{feeOptions.slow} sat/vB</div>
            </button>
            <button
              onClick={() => setSelectedFeeRate('medium')}
              disabled={isLoading}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${selectedFeeRate === 'medium'
                ? 'bg-[rgb(var(--primary-blue))] text-white border-[rgb(var(--primary-blue))]'
                : 'bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] border-[rgb(var(--card-border))] hover:border-[rgb(var(--primary-blue))]'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>Medium</div>
              <div className="text-xs opacity-70">{feeOptions.medium} sat/vB</div>
            </button>
            <button
              onClick={() => setSelectedFeeRate('fast')}
              disabled={isLoading}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${selectedFeeRate === 'fast'
                ? 'bg-[rgb(var(--primary-blue))] text-white border-[rgb(var(--primary-blue))]'
                : 'bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] border-[rgb(var(--card-border))] hover:border-[rgb(var(--primary-blue))]'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>Fast</div>
              <div className="text-xs opacity-70">{feeOptions.fast} sat/vB</div>
            </button>
          </div>
        </div>
      )}

      <FormError error={error} />

      <div className="flex gap-3 mt-6">
        <PrimaryButton
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 bg-gray-600 hover:bg-gray-700"
        >
          Back
        </PrimaryButton>
        <PrimaryButton
          onClick={onNext}
          disabled={isLoading || !amount || parseInt(amount) <= 0 || Boolean(needsFeeSelection && !selectedFeeRate)}
          className="flex-1"
        >
          {isLoading ? (
            <LoadingSpinner text="Processing..." size="small" />
          ) : 'Continue'}
        </PrimaryButton>
      </div>
    </FormGroup>
  );
};

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  amountSats,
  feesSat,
  error,
  isLoading,
  onConfirm,
}) => {
  return (
    <FormGroup>
      <center className="m-6">
        <FormDescription>
          You are requested to pay
        </FormDescription>
        <div className="mt-2 text-2xl font-bold text-[rgb(var(--text-white))]">
          {((amountSats || 0) + (feesSat || 0)).toLocaleString()} sats
        </div>
      </center>
      <PaymentInfoCard>
        <PaymentInfoRow
          label="Amount"
          value={`${amountSats?.toLocaleString() || '0'} sats`}
        />
        <PaymentInfoRow
          label="Fee"
          value={`${feesSat?.toLocaleString() || '0'} sats`}
        />
        <PaymentInfoDivider />
      </PaymentInfoCard>

      <FormError error={error} />

      <div className="mt-6 flex justify-center">
        <PrimaryButton onClick={onConfirm} disabled={isLoading}>
          {isLoading ? (
            <LoadingSpinner text="Processing..." size="small" />
          ) : 'Pay'}
        </PrimaryButton>
      </div>
    </FormGroup>
  );
};

const ProcessingStep: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <LoadingSpinner text="Processing payment..." />
    </div>
  );
};

const ResultStep: React.FC<ResultStepProps> = ({ result, error, onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <ResultIcon type={result} />
      <ResultMessage
        title={result === 'success' ? 'Payment Successful!' : 'Payment Failed'}
        description={result === 'success'
          ? 'Your payment has been sent successfully.'
          : error || 'There was an error processing your payment.'}
      />
      <PrimaryButton onClick={onClose} className="mt-6">
        Close
      </PrimaryButton>
    </div>
  );
};

// Main component
const SendPaymentDialog: React.FC<SendPaymentDialogProps> = ({ isOpen, onClose, initialParsedData }) => {
  const wallet = useWallet();
  // State
  const [currentStep, setCurrentStep] = useState<PaymentStep>('input');
  const [paymentInput, setPaymentInput] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedFeeRate, setSelectedFeeRate] = useState<'fast' | 'medium' | 'slow' | null>(null);
  const [feeOptions, setFeeOptions] = useState<FeeOptions | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<Bolt11InvoiceDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prepareResponse, setPrepareResponse] = useState<PrepareSendPaymentResponse | null>(null);
  const [parsedInput, setParsedInput] = useState<InputType | null>(null);

  // Reset state when dialog opens, or process initial data
  useEffect(() => {
    if (isOpen) {
      resetState();

      // If we have initial parsed data from QR scan, process it immediately
      if (initialParsedData) {
        processInitialParsedData(initialParsedData);
      }
    }
  }, [isOpen, initialParsedData]);

  const resetState = () => {
    setCurrentStep('input');
    setPaymentInput('');
    setAmount('');
    setSelectedFeeRate(null);
    setFeeOptions(null);
    setPaymentInfo(null);
    setPrepareResponse(null);
    setParsedInput(null);
    setError(null);
    setPaymentResult(null);
    setIsLoading(false);
  };

  // Process initial parsed data from QR scan
  const processInitialParsedData = async (parseResult: InputType) => {
    try {
      setParsedInput(parseResult);

      // Populate the input field with the scanned data
      if (parseResult.type === 'bolt11Invoice') {
        setPaymentInput(parseResult.invoice.bolt11);

        // Handle bolt11 invoice
        const invoice = parseResult;
        setPaymentInfo(invoice);

        if (!invoice.amountMsat || invoice.amountMsat === 0) {
          // Zero-amount invoice - go to amount step
          setCurrentStep('amount');
        } else {
          // Invoice with amount - prepare payment directly
          await prepareSendPayment(invoice);
        }
      } else if (parseResult.type === 'bitcoinAddress') {
        setPaymentInput(parseResult.address);
        // For Bitcoin addresses, always go to amount step
        setCurrentStep('amount');
      } else if (parseResult.type === 'sparkAddress') {
        setPaymentInput(parseResult.address);
        // For Spark addresses, always go to amount step
        setCurrentStep('amount');
      } else {
        setError('Invalid payment destination');
        setCurrentStep('input');
      }
    } catch (err) {
      console.error('Failed to process initial parsed data:', err);
      setError('Failed to process scanned payment data');
      setCurrentStep('input');
    }
  };

  // Unified payment processing function
  const processPaymentInput = async () => {
    if (!paymentInput.trim()) {
      setError('Please enter a payment destination');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, use sdk.parse to determine the input type
      const parseResult = await wallet.parseInput(paymentInput.trim());
      setParsedInput(parseResult);

      if (parseResult.type === 'bolt11Invoice') {
        // Handle bolt11 invoice
        const invoice = parseResult;
        setPaymentInfo(invoice);

        if (!invoice.amountMsat || invoice.amountMsat === 0) {
          // Zero invoice - need amount input
          setCurrentStep('amount');
        } else {
          // Invoice with amount - proceed directly to prepare payment
          await prepareSendPayment(invoice);
        }
      } else if (parseResult.type === 'bitcoinAddress') {
        // For Bitcoin addresses, we need amount input
        setCurrentStep('amount');
      } else if (parseResult.type === 'sparkAddress') {
        // Spark address - need amount input
        setCurrentStep('amount');
      } else {
        setError('Invalid payment destination');
      }
    } catch (err) {
      console.error('Failed to parse input:', err);
      setError('Invalid payment destination');
    } finally {
      setIsLoading(false);
    }
  };

  // Process payment with amount (for zero invoices, Spark, and Bitcoin addresses)
  const processPaymentWithAmount = async () => {
    if (!parsedInput || !amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (parsedInput.type === 'bolt11Invoice') {
        // Zero invoice with user-provided amount
        const invoice = parsedInput;
        setPaymentInfo(invoice);
        await prepareSendPayment(invoice, parseInt(amount));
      } else {
        // Spark or Bitcoin address
        const response = await wallet.prepareSendPayment({
          paymentRequest: paymentInput.trim(),
          amountSats: parseInt(amount),
        });

        setPrepareResponse(response);

        if (response.paymentMethod.type === 'bitcoinAddress') {
          // Set fee options for Bitcoin payments
          setFeeOptions(BITCOIN_FEE_PRESETS);

          // If no fee rate selected yet, don't proceed to confirm
          if (!selectedFeeRate) {
            setIsLoading(false);
            return;
          }
        }

        setCurrentStep('confirm');
      }
    } catch (err) {
      console.error('Failed to prepare payment:', err);
      setError('Failed to prepare payment');
    } finally {
      setIsLoading(false);
    }
  };

  const prepareSendPayment = async (invoice: Bolt11InvoiceDetails, userAmount?: number) => {
    const amountSat = userAmount || (invoice.amountMsat ? invoice.amountMsat / 1000 : 0);

    if (amountSat <= 0) {
      setError('Invalid amount');
      return;
    }

    setIsLoading(true);

    try {
      const response = await wallet.prepareSendPayment({
        paymentRequest: invoice.invoice.bolt11,
        amountSats: amountSat,
      });

      setPrepareResponse(response);
      setCurrentStep('confirm');
    } catch (err) {
      console.error('Failed to estimate fee:', err);
      setError(`Failed to estimate fee: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPayment = async () => {
    if (!prepareResponse) {
      setError('Cannot send payment: missing required information');
      return;
    }

    setCurrentStep('processing');
    setIsLoading(true);

    try {
      let useSpark = false;
      if (prepareResponse.paymentMethod.type === 'bolt11Invoice') {
        useSpark = (prepareResponse.paymentMethod as any).sparkTransferFeeSats != null;
      }
      const result = await wallet.sendPayment({ prepareResponse, options: { type: 'bolt11Invoice', useSpark } });
      console.log('Payment result:', result);
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

  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[rgb(var(--text-white))]">
          Payment Destination
        </label>
        <textarea
          value={paymentInput}
          onChange={(e) => setPaymentInput(e.target.value)}
          placeholder="Enter Lightning invoice, Spark address, or Bitcoin address..."
          className="w-full p-3 border border-[rgb(var(--card-border))] rounded-lg bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))] placeholder-[rgb(var(--text-white))] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-blue))] resize-none"
          rows={3}
          disabled={isLoading}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <PrimaryButton
          onClick={processPaymentInput}
          disabled={isLoading || !paymentInput.trim()}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </PrimaryButton>
      </div>
    </div>
  );

  const getStepIndex = (step: PaymentStep): number => {
    const steps: PaymentStep[] = ['input', 'amount', 'confirm', 'processing', 'result'];
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
    if (currentStep === 'amount') {
      return getPaymentMethodName();
    }
    return 'Send Payment';
  };

  // Don't render if not open
  //if (!isOpen) return null;

  // Extract payment details
  let amountSats: number | null = null;
  let feesSat: number | null = null;

  if (paymentInfo && paymentInfo.amountMsat) {
    amountSats = paymentInfo.amountMsat / 1000;
  } else if (amount && parseInt(amount) > 0) {
    amountSats = parseInt(amount);
  }

  if (prepareResponse) {
    const paymentMethod = prepareResponse.paymentMethod;
    if (paymentMethod.type === 'bolt11Invoice') {
      // Use preferSpark checkbox to determine which fee to display
      const method = paymentMethod as any;
      if (method.sparkTransferFeeSats != null) {
        feesSat = method.sparkTransferFeeSats;
      } else if (method.lightningFeeSats != null) {
        feesSat = method.lightningFeeSats;
      }
    } else if (paymentMethod.type === 'bitcoinAddress') {
      feesSat = (paymentMethod as any).feeQuote?.totalFees || 0;
    }
  }

  return (
    <BottomSheetContainer isOpen={isOpen} onClose={onClose}>
      <BottomSheetCard className="bottom-sheet-card">
        <DialogHeader title={getDialogTitle()} onClose={onClose} />

        <StepContainer>
          {/* Input Step */}
          <StepContent
            isActive={currentStep === 'input'}
            isLeft={getStepIndex('input') < getStepIndex(currentStep)}
          >
            {renderInputStep()}
          </StepContent>

          {/* Amount Step */}
          <StepContent
            isActive={currentStep === 'amount'}
            isLeft={getStepIndex('amount') < getStepIndex(currentStep)}
          >
            <AmountStep
              paymentMethod={getPaymentMethodName()}
              paymentInput={paymentInput}
              amount={amount}
              setAmount={setAmount}
              selectedFeeRate={selectedFeeRate}
              setSelectedFeeRate={setSelectedFeeRate}
              feeOptions={feeOptions}
              isLoading={isLoading}
              error={error}
              onBack={() => setCurrentStep('input')}
              onNext={processPaymentWithAmount}
            />
          </StepContent>

          {/* Confirm Step */}
          <StepContent
            isActive={currentStep === 'confirm'}
            isLeft={getStepIndex('confirm') < getStepIndex(currentStep)}
          >
            <ConfirmStep
              amountSats={amountSats}
              feesSat={feesSat}
              error={error}
              isLoading={isLoading}
              onBack={() => setCurrentStep('input')}
              onConfirm={sendPayment}
            />
          </StepContent>

          {/* Processing Step */}
          <StepContent
            isActive={currentStep === 'processing'}
            isLeft={getStepIndex('processing') < getStepIndex(currentStep)}
          >
            <ProcessingStep />
          </StepContent>

          {/* Result Step */}
          <StepContent
            isActive={currentStep === 'result'}
            isLeft={getStepIndex('result') < getStepIndex(currentStep)}
          >
            <ResultStep
              result={paymentResult === 'success' ? 'success' : 'failure'}
              error={error}
              onClose={onClose}
            />
          </StepContent>
        </StepContainer>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default SendPaymentDialog;
