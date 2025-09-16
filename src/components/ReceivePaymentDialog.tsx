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
type PaymentMethod = 'lightning' | 'spark' | 'bitcoin';
type ReceiveStep = 'loading_limits' | 'input' | 'qr' | 'loading';

// Props interfaces
interface ReceivePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  walletService: typeof walletService;
}



interface QRCodeDisplayProps {
  paymentData: string;
  feeSats: number;
  title: string;
  description?: string;
}


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

// Component for Lightning Address display and management
interface LightningAddressDisplayProps {
  address: string | null;
  isLoading: boolean;
  isEditing: boolean;
  editValue: string;
  error: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditValueChange: (value: string) => void;
  onCustomizeAmount: () => void;
}

// Custom CopyableText with Edit Icon for Lightning Address
const EditableAddressText: React.FC<{
  text: string;
  onEdit: () => void;
}> = ({ text, onEdit }) => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={text}
        readOnly
        className="w-full px-3 py-2 pr-12 bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))] rounded text-center"
      />
      <button
        onClick={onEdit}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-[rgb(var(--text-white))] hover:text-[var(--primary-blue)] transition-colors"
        title="Edit Lightning Address"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  );
};

const LightningAddressDisplay: React.FC<LightningAddressDisplayProps> = ({
  address,
  isLoading,
  isEditing,
  editValue,
  error,
  onEdit,
  onSave,
  onCancel,
  onEditValueChange,
  onCustomizeAmount
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner text="Loading Lightning Address..." />
      </div>
    );
  }

  if (!address && !isEditing) {
    return (
      <div className="pt-4 space-y-6 flex flex-col items-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">Lightning Address</h3>
          <p className="text-[rgb(var(--text-white))] opacity-75 text-sm mb-4">
            Create a Lightning Address to receive payments easily
          </p>
          <PrimaryButton onClick={onEdit}>
            Create Lightning Address
          </PrimaryButton>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="pt-4 space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">
            {address ? 'Edit Lightning Address' : 'Create Lightning Address'}
          </h3>
        </div>

        <FormGroup>
          <FormInput
            id="lightning-address"
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            placeholder="username"
            disabled={isLoading}
          />
          <FormError error={error} />
        </FormGroup>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[rgb(var(--text-white))] border border-[rgb(var(--text-white))] rounded-lg hover:bg-[rgb(var(--text-white))] hover:text-[rgb(var(--bg-primary))] transition-colors"
          >
            Cancel
          </button>
          <PrimaryButton onClick={onSave} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="small" /> : 'Save'}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-6 flex flex-col items-center">
      <div className="text-center">
        <h3 className="text-lg font-medium text-[rgb(var(--text-white))] mb-2">Lightning Address</h3>
        <p className="text-[rgb(var(--text-white))] opacity-75 text-sm">
          Share this address to receive Lightning payments
        </p>
      </div>

      <QRCodeContainer value={address || ''} />

      <div className="w-full space-y-4">
        <EditableAddressText text={address || ''} onEdit={onEdit} />

        <div className="flex justify-center">
          <PrimaryButton onClick={onCustomizeAmount}>
            Customize Amount
          </PrimaryButton>
        </div>
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
const ReceivePaymentDialog: React.FC<ReceivePaymentDialogProps> = ({ isOpen, onClose, walletService }): JSX.Element => {
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

  // State for Lightning Address
  const [lightningAddress, setLightningAddress] = useState<string | null>(null);
  const [lightningAddressLoading, setLightningAddressLoading] = useState<boolean>(false);
  const [isEditingLightningAddress, setIsEditingLightningAddress] = useState<boolean>(false);
  const [lightningAddressEditValue, setLightningAddressEditValue] = useState<string>('');
  const [lightningAddressError, setLightningAddressError] = useState<string | null>(null);
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
    setIsEditingLightningAddress(false);
    setLightningAddressEditValue('');
    setLightningAddressError(null);
    setShowAmountPanel(false);
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

    // Close the amount panel immediately when starting to generate
    if (showAmountPanel) {
      setShowAmountPanel(false);
    }

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

  // Load Lightning Address on-demand
  const loadLightningAddress = async () => {
    if (lightningAddress !== null || lightningAddressLoading) return;

    setLightningAddressLoading(true);
    try {
      const address = await walletService.getLightningAddress();
      setLightningAddress(address);
    } catch (err) {
      console.error('Failed to load Lightning address:', err);
      setLightningAddressError(`Failed to load Lightning address: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLightningAddressLoading(false);
    }
  };

  // Lightning Address management functions
  const handleEditLightningAddress = () => {
    // Extract username from full address for editing (e.g., "user@breez.technology" -> "user")
    const username = lightningAddress?.includes('@')
      ? lightningAddress.split('@')[0]
      : lightningAddress || '';
    setLightningAddressEditValue(username);
    setIsEditingLightningAddress(true);
    setLightningAddressError(null);
  };

  const handleCancelEditLightningAddress = () => {
    setIsEditingLightningAddress(false);
    setLightningAddressEditValue('');
    setLightningAddressError(null);
  };

  const handleSaveLightningAddress = async () => {
    if (!lightningAddressEditValue.trim()) {
      setLightningAddressError('Please enter a username');
      return;
    }

    // Extract username from full address if provided (e.g., "user@domain" -> "user")
    const username = lightningAddressEditValue.includes('@')
      ? lightningAddressEditValue.split('@')[0]
      : lightningAddressEditValue;

    setLightningAddressLoading(true);
    setLightningAddressError(null);

    try {
      // Check if username is available
      const isAvailable = await walletService.checkLightningAddressAvailable(username);

      if (!isAvailable) {
        setLightningAddressError('This username is not available');
        setLightningAddressLoading(false);
        return;
      }

      // Register the new address with description
      await walletService.registerLightningAddress(username, description || 'Lightning Address');

      // Get the actual lightning address from the wallet service
      const actualAddress = await walletService.getLightningAddress();
      setLightningAddress(actualAddress);
      setIsEditingLightningAddress(false);
      setLightningAddressEditValue('');
    } catch (err) {
      console.error('Failed to save Lightning address:', err);
      setLightningAddressError(`Failed to save Lightning address: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLightningAddressLoading(false);
    }
  };

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
          <div className="relative">
            <div
              className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-600 transition-transform duration-300 ease-in-out z-40 shadow-lg ${activeTab === 'lightning' && showAmountPanel ? 'translate-y-0' : 'translate-y-full'
                }`}
              style={{
                height: 'calc(100vh - 200px)',
                maxHeight: '400px'
              }}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-[rgb(var(--text-white))]">Customize Amount</h4>
                  <button
                    onClick={() => setShowAmountPanel(false)}
                    className="text-[rgb(var(--text-white))] opacity-75 hover:opacity-100 p-1"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <FormGroup>
                    <FormGroup className="pt-2">
                      <div>
                        <FormInput
                          id="amount"
                          type="number"
                          min={limits.min}
                          max={limits.max}
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
                  </FormGroup>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-600">
                  <PrimaryButton
                    onClick={generateBolt11Invoice}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <LoadingSpinner text="Creating invoice..." size="small" />
                    ) : 'Create Invoice'}
                  </PrimaryButton>
                </div>
              </div>
            </div>

            {/* Backdrop overlay when panel is open */}
            {activeTab === 'lightning' && showAmountPanel && (
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-30"
                onClick={() => setShowAmountPanel(false)}
              />
            )}
          </div>
        </TabContainer>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default ReceivePaymentDialog;
