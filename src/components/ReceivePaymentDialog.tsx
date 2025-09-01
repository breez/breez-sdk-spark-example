import React, { useState, useEffect } from 'react';
import * as walletService from '../services/walletService';
import LoadingSpinner from './LoadingSpinner';
import {
  DialogHeader, FormGroup,
  FormInput, FormError, PrimaryButton,
  QRCodeContainer, CopyableText, Alert, StepContainer, BottomSheetCard, BottomSheetContainer,
  TabContainer, TabList, Tab, TabPanel
} from './ui';

// Types
type PaymentMethod = 'bolt11' | 'spark' | 'bitcoin';
type ReceiveStep = 'loading_limits' | 'input' | 'qr' | 'loading';

// Props interfaces
interface ReceivePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  walletService: typeof walletService;
}

interface Bolt11FormProps {
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
  paymentData: string;
  feeSats: number;
  title: string;
  description?: string;
}

// Component for Bolt11 invoice form
const Bolt11Form: React.FC<Bolt11FormProps> = ({
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
            <LoadingSpinner text="Creating invoice..." size="small" />
          ) : 'Create Invoice'}
        </PrimaryButton>
      </div>
    </FormGroup>
  );
};

// Component for Spark address display
const SparkAddressDisplay: React.FC<{ address: string | null; isLoading: boolean }> = ({ address, isLoading }) => {
  if (isLoading || !address) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner text="Generating Spark address..." />
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-6 flex flex-col items-center">
      <div className="text-center">
        <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">Spark Address</h3>
        <p className="text-[rgb(var(--text-white))] opacity-75 text-sm">
          Send to this Spark address for instant Lightning payments
        </p>
      </div>

      <QRCodeContainer value={address} />

      <div className="w-full">
        <CopyableText text={address} />
      </div>
    </div>
  );
};

// Component for Bitcoin address display
const BitcoinAddressDisplay: React.FC<{ address: string | null; isLoading: boolean }> = ({ address, isLoading }) => {
  if (isLoading || !address) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner text="Generating Bitcoin address..." />
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-6 flex flex-col items-center">
      <div className="text-center">
        <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">Bitcoin Address</h3>
        <p className="text-[rgb(var(--text-white))] opacity-75 text-sm">
          Send Bitcoin to this address for automatic Lightning conversion
        </p>
      </div>

      <QRCodeContainer value={address} />

      <div className="w-full">
        <CopyableText text={address} />
      </div>
    </div>
  );
};

// Component to display QR code with payment data
const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ paymentData, feeSats, title, description }) => {
  return (
    <div className="pt-8 space-y-6 flex flex-col items-center">
      <div className="text-center">
        <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">{title}</h3>
        {description && (
          <p className="text-[rgb(var(--text-white))] opacity-75 text-sm">{description}</p>
        )}
      </div>

      <QRCodeContainer value={paymentData} />

      <div className="w-full">
        <CopyableText text={paymentData} />

        {feeSats > 0 && (
          <Alert type="warning" className="mt-8">
            <center>A fee of {feeSats} sats is applied to this transaction.</center>
          </Alert>
        )}
      </div>
    </div>
  );
};

// Main component
const ReceivePaymentDialog: React.FC<ReceivePaymentDialogProps> = ({ isOpen, onClose, walletService }) => {
  // State
  const [activeTab, setActiveTab] = useState<PaymentMethod>('bolt11');
  const [currentStep, setCurrentStep] = useState<ReceiveStep>('loading_limits');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState<string>('');
  const [feeSats, setFeeSats] = useState<number>(0);
  const [limits, setLimits] = useState<{ min: number, max: number }>({ min: 1, max: 1000000 });

  // State for on-demand address generation
  const [sparkAddress, setSparkAddress] = useState<string | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
  const [sparkLoading, setSparkLoading] = useState<boolean>(false);
  const [bitcoinLoading, setBitcoinLoading] = useState<boolean>(false);

  // Reset state when dialog opens and set default limits
  useEffect(() => {
    if (isOpen) {
      resetState();
      setDefaultLimits();
      setActiveTab('bolt11');
    }
  }, [isOpen]);

  const resetState = () => {
    setCurrentStep('loading_limits');
    setDescription('');
    setAmount('');
    setError(null);
    setIsLoading(false);
    setPaymentData('');
    setFeeSats(0);
    // Reset addresses when dialog closes
    setSparkAddress(null);
    setBitcoinAddress(null);
    setSparkLoading(false);
    setBitcoinLoading(false);
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

  // Generate Bolt11 invoice
  const generateBolt11Invoice = async () => {
    setError(null);
    setIsLoading(true);
    setCurrentStep('loading');

    try {
      const amountSats = parseInt(amount);
      const receiveResponse = await walletService.receivePayment({
        paymentMethod: {
          type: 'bolt11Invoice',
          description,
          amountSats
        }
      });
      setPaymentData(receiveResponse.paymentRequest);
      setFeeSats(receiveResponse.feeSats || 0);
      setCurrentStep('qr');
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      setError(`Failed to generate invoice: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setCurrentStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Spark address on-demand
  const generateSparkAddress = async () => {
    if (sparkAddress || sparkLoading) return; // Don't generate if already exists or loading

    setSparkLoading(true);
    try {
      const receiveResponse = await walletService.receivePayment({
        paymentMethod: { type: 'sparkAddress' }
      });
      setSparkAddress(receiveResponse.paymentRequest);
    } catch (err) {
      console.error('Failed to generate Spark address:', err);
      setError(`Failed to generate Spark address: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSparkLoading(false);
    }
  };

  // Generate Bitcoin address on-demand
  const generateBitcoinAddress = async () => {
    if (bitcoinAddress || bitcoinLoading) return; // Don't generate if already exists or loading

    setBitcoinLoading(true);
    try {
      const receiveResponse = await walletService.receivePayment({
        paymentMethod: { type: 'bitcoinAddress' }
      });
      setBitcoinAddress(receiveResponse.paymentRequest);
    } catch (err) {
      console.error('Failed to generate Bitcoin address:', err);
      setError(`Failed to generate Bitcoin address: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBitcoinLoading(false);
    }
  };


  // Handle tab change
  const handleTabChange = (tab: PaymentMethod) => {
    setActiveTab(tab);
    resetState();
    setDefaultLimits();

    // Generate addresses on-demand when switching to those tabs
    if (tab === 'spark') {
      generateSparkAddress();
    } else if (tab === 'bitcoin') {
      generateBitcoinAddress();
    }
  };

  const getQRTitle = () => {
    switch (activeTab) {
      case 'bolt11': return 'Lightning Invoice';
      case 'spark': return 'Spark Address';
      case 'bitcoin': return 'Bitcoin Address';
      default: return 'Payment Request';
    }
  };

  const getQRDescription = () => {
    switch (activeTab) {
      case 'bolt11': return 'Scan to pay this Lightning invoice';
      case 'spark': return 'Use this address to receive payments';
      case 'bitcoin': return 'Send Bitcoin to this address for automatic Lightning conversion';
      default: return '';
    }
  };

  return (
    <BottomSheetContainer isOpen={isOpen} onClose={onClose}>
      <BottomSheetCard className="bottom-sheet-card">
        <DialogHeader title="Receive Payment" onClose={onClose} />

        <TabContainer>
          <TabList>
            <Tab
              isActive={activeTab === 'bolt11'}
              onClick={() => handleTabChange('bolt11')}
            >
              Lightning Invoice
            </Tab>
            <Tab
              isActive={activeTab === 'spark'}
              onClick={() => handleTabChange('spark')}
            >
              Spark Address
            </Tab>
            <Tab
              isActive={activeTab === 'bitcoin'}
              onClick={() => handleTabChange('bitcoin')}
            >
              Bitcoin Address
            </Tab>
          </TabList>

          <StepContainer>
            {currentStep === 'loading_limits' && (
              <div className="flex flex-col items-center justify-center h-40">
                <LoadingSpinner />
              </div>
            )}

            {currentStep === 'input' && (
              <>
                <TabPanel isActive={activeTab === 'bolt11'}>
                  <Bolt11Form
                    description={description}
                    setDescription={setDescription}
                    amount={amount}
                    setAmount={setAmount}
                    minAmount={limits.min}
                    maxAmount={limits.max}
                    error={error}
                    isLoading={isLoading}
                    onSubmit={generateBolt11Invoice}
                  />
                </TabPanel>

                <TabPanel isActive={activeTab === 'spark'}>
                  <SparkAddressDisplay address={sparkAddress} isLoading={sparkLoading} />
                </TabPanel>

                <TabPanel isActive={activeTab === 'bitcoin'}>
                  <BitcoinAddressDisplay address={bitcoinAddress} isLoading={bitcoinLoading} />
                </TabPanel>
              </>
            )}

            {currentStep === 'loading' && (
              <div className="flex flex-col items-center justify-center h-40">
                <LoadingSpinner text={`Generating ${getQRTitle().toLowerCase()}...`} />
              </div>
            )}

            {currentStep === 'qr' && (
              <QRCodeDisplay
                paymentData={paymentData}
                feeSats={feeSats}
                title={getQRTitle()}
                description={getQRDescription()}
              />
            )}
          </StepContainer>
        </TabContainer>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default ReceivePaymentDialog;
