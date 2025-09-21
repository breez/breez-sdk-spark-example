import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import LoadingSpinner from './LoadingSpinner';
import {
  DialogHeader,
  QRCodeContainer, CopyableText, Alert, StepContainer, BottomSheetCard, BottomSheetContainer,
  TabContainer, TabList, Tab, TabPanel
} from './ui';

// Types
import type { PaymentMethod, ReceiveStep } from '../types/domain';
import { DEFAULT_RECEIVE_LIMITS } from '../constants/limits';
import { useLightningAddress } from '../features/receive/hooks/useLightningAddress';
import SparkAddressDisplay from '../features/receive/SparkAddressDisplay';
import BitcoinAddressDisplay from '../features/receive/BitcoinAddressDisplay';
import LightningAddressDisplay from '../features/receive/LightningAddressDisplay';
import AmountPanel from '../features/receive/AmountPanel';

// Props interfaces
interface ReceivePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}



interface QRCodeDisplayProps {
  paymentData: string;
  feeSats: number;
  title: string;
  description?: string;
}

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
const ReceivePaymentDialog: React.FC<ReceivePaymentDialogProps> = ({ isOpen, onClose }): JSX.Element => {
  const wallet = useWallet();
  // State
  const [activeTab, setActiveTab] = useState<PaymentMethod>('lightning');
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

  // Lightning Address lifecycle via hook
  const {
    address: lightningAddress,
    isLoading: lightningAddressLoading,
    isEditing: isEditingLightningAddress,
    editValue: lightningAddressEditValue,
    error: lightningAddressError,
    load: loadLightningAddress,
    beginEdit: beginEditLightningAddress,
    cancelEdit: cancelEditLightningAddress,
    setEditValue: setLightningAddressEditValue,
    save: saveLightningAddress,
    reset: resetLightningAddress,
  } = useLightningAddress();
  const [showAmountPanel, setShowAmountPanel] = useState<boolean>(false);

  // Reset state when dialog opens and set default limits
  useEffect(() => {
    if (isOpen) {
      resetState();
      setDefaultLimits();
      setActiveTab('lightning');
      loadLightningAddress();
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
    // Reset Lightning Address state
    resetLightningAddress();
    setShowAmountPanel(false);
  };

  // Set default limits since fetchLightningLimits is not available in new API
  const setDefaultLimits = async () => {
    try {
      // Set reasonable default limits for receiving lightning payments
      setLimits(DEFAULT_RECEIVE_LIMITS);

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

    // Close the amount panel immediately when starting to generate
    if (showAmountPanel) {
      setShowAmountPanel(false);
    }

    try {
      const amountSats = parseInt(amount);
      const receiveResponse = await wallet.receivePayment({
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
      const receiveResponse = await wallet.receivePayment({
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
      const receiveResponse = await wallet.receivePayment({
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

  // Lightning Address management via hook
  const handleEditLightningAddress = () => beginEditLightningAddress(lightningAddress);
  const handleCancelEditLightningAddress = () => cancelEditLightningAddress();
  const handleSaveLightningAddress = async () => saveLightningAddress(description || 'Lightning Address');

  const handleCustomizeAmount = () => {
    setShowAmountPanel(true);
  };


  // Handle tab change
  const handleTabChange = (tab: PaymentMethod) => {
    setActiveTab(tab);
    setCurrentStep('input');
    setError(null);
    setPaymentData('');
    setFeeSats(0);

    if (tab === 'lightning') {
      loadLightningAddress();
    } else if (tab === 'spark') {
      generateSparkAddress();
    } else if (tab === 'bitcoin') {
      generateBitcoinAddress();
    }
  };

  const getQRTitle = () => {
    switch (activeTab) {
      case 'lightning': return 'Lightning Invoice';
      case 'spark': return 'Spark Address';
      case 'bitcoin': return 'Bitcoin Address';
      default: return 'Payment Request';
    }
  };

  const getQRDescription = () => {
    switch (activeTab) {
      case 'lightning': return 'Scan to pay this Lightning invoice';
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
              isActive={activeTab === 'lightning'}
              onClick={() => handleTabChange('lightning')}
            >
              Lightning
            </Tab>
            <Tab
              isActive={activeTab === 'spark'}
              onClick={() => handleTabChange('spark')}
            >
              Spark
            </Tab>
            <Tab
              isActive={activeTab === 'bitcoin'}
              onClick={() => handleTabChange('bitcoin')}
            >
              Bitcoin
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
                <TabPanel isActive={activeTab === 'lightning'}>
                  <LightningAddressDisplay
                    address={lightningAddress}
                    isLoading={lightningAddressLoading}
                    isEditing={isEditingLightningAddress}
                    editValue={lightningAddressEditValue}
                    error={lightningAddressError}
                    onEdit={handleEditLightningAddress}
                    onSave={handleSaveLightningAddress}
                    onCancel={handleCancelEditLightningAddress}
                    onEditValueChange={setLightningAddressEditValue}
                    onCustomizeAmount={handleCustomizeAmount}
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

          {/* Sliding Bottom Panel for Amount Customization */}
          <AmountPanel
            isOpen={activeTab === 'lightning' && showAmountPanel}
            amount={amount}
            setAmount={setAmount}
            description={description}
            setDescription={setDescription}
            limits={limits}
            isLoading={isLoading}
            error={error}
            onCreateInvoice={generateBolt11Invoice}
            onClose={() => setShowAmountPanel(false)}
          />
        </TabContainer>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default ReceivePaymentDialog;
