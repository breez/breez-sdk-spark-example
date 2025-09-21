import React, { useState, useEffect } from 'react';
import { DialogHeader, StepContainer, StepContent, BottomSheetContainer, BottomSheetCard } from './ui';
import { useWallet } from '../contexts/WalletContext';
import { Bolt11InvoiceDetails, PrepareSendPaymentResponse, InputType } from '@breeztech/breez-sdk-spark';

// Types
import type { PaymentStep, FeeOptions } from '../types/domain';
import { BITCOIN_FEE_PRESETS } from '../constants/fees';
type PaymentResult = 'success' | 'failure' | null;

// Props interfaces
interface SendPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialParsedData?: InputType | null;
}
// External step components
import InputStep from '../features/send/steps/InputStep';
import AmountStep from '../features/send/steps/AmountStep';
import ConfirmStep from '../features/send/steps/ConfirmStep';
import ProcessingStep from '../features/send/steps/ProcessingStep';
import ResultStep from '../features/send/steps/ResultStep';

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

  // Input step moved to external component

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
            <InputStep
              paymentInput={paymentInput}
              setPaymentInput={setPaymentInput}
              isLoading={isLoading}
              error={error}
              onContinue={processPaymentInput}
            />
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
