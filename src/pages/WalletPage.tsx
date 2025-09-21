import React, { useState, useRef, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import {
  LoadingSpinner
} from '../components/ui';
import SendPaymentDialog from '../features/send/SendPaymentDialog';
import ReceivePaymentDialog from '../features/receive/ReceivePaymentDialog';
import QrScannerDialog from '../components/QrScannerDialog';
import PaymentDetailsDialog from '../components/PaymentDetailsDialog';
import CollapsingWalletHeader from '../components/CollapsingWalletHeader';
import TransactionList from '../components/TransactionList';
import { GetInfoResponse, Payment, Config } from '@breeztech/breez-sdk-spark';

interface WalletPageProps {
  walletInfo: GetInfoResponse | null;
  transactions: Payment[];
  usdRate: number | null;
  refreshWalletData: (showLoading?: boolean) => Promise<void>;
  isRestoring: boolean;
  error: string | null;
  onClearError: () => void;
  onLogout: () => void;
  config: Config | null;
}

const WalletPage: React.FC<WalletPageProps> = ({
  walletInfo,
  transactions,
  usdRate,
  refreshWalletData,
  isRestoring,
  onLogout,
  config
}) => {
  const wallet = useWallet();
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [scannedPaymentData, setScannedPaymentData] = useState<any>(null);

  const transactionsContainerRef = useRef<HTMLDivElement>(null);
  const collapseThreshold = 100; // pixels of scroll before header is fully collapsed

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (transactionsContainerRef.current) {
      const scrollTop = transactionsContainerRef.current.scrollTop;
      // Calculate scroll progress from 0 to 1
      const progress = Math.min(1, scrollTop / collapseThreshold);
      setScrollProgress(progress);
    }
  }, [collapseThreshold]);

  // Handler for payment selection from the transaction list
  const handlePaymentSelected = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
  }, []);

  // Handler for closing payment details dialog
  const handlePaymentDetailsClose = useCallback(() => {
    setSelectedPayment(null);
  }, []);

  // Handler for closing the send dialog and refreshing data
  const handleSendDialogClose = useCallback(() => {
    setIsSendDialogOpen(false);
    setScannedPaymentData(null); // Clear scanned data when dialog closes
    // Refresh wallet data to show any new transactions
    refreshWalletData(false);
  }, [refreshWalletData]);

  const handleReceiveDialogClose = useCallback(() => {
    setIsReceiveDialogOpen(false);
    // Refresh wallet data to show any new transactions
    refreshWalletData(false);
  }, [refreshWalletData]);

  const handleQrScannerClose = () => {
    setIsQrScannerOpen(false);
  };

  const handleQrScan = async (data: string | null) => {
    if (!data) return;

    try {
      // Parse the QR code result with SDK
      const parseResult = await wallet.parseInput(data);
      console.log('Parsed QR result:', parseResult);

      // Close QR scanner
      setIsQrScannerOpen(false);

      // Set the scanned payment data to pass to SendPaymentDialog
      setScannedPaymentData(parseResult);

      // Open send dialog - it will automatically route to the appropriate step
      setIsSendDialogOpen(true);
    } catch (error) {
      console.error('Failed to parse QR code:', error);
    }
  };

  return (

    <div className="flex flex-col h-[calc(100dvh)] relative bg-[var(--card-bg)]">
      {/* Show restoration overlay if we're restoring */}
      {isRestoring && (
        <div className="absolute inset-0 bg-[rgb(var(--background-rgb))] bg-opacity-80 z-50 flex items-center justify-center">
          <LoadingSpinner text="Restoring wallet data..." />
        </div>
      )}

      {/* Fixed position header that collapses on scroll */}
      <div className="sticky top-0 z-10 bg-[rgb(var(--background-rgb))]">
        <CollapsingWalletHeader
          walletInfo={walletInfo}
          usdRate={usdRate}
          config={config}
          scrollProgress={scrollProgress}
          onLogout={onLogout}
        />
      </div>

      {/* Scrollable transaction list */}
      <div
        ref={transactionsContainerRef}
        className="flex-grow overflow-y-auto"
        onScroll={handleScroll}
      >
        <TransactionList
          transactions={transactions}
          onPaymentSelected={handlePaymentSelected}
        />
      </div>

      {/* Send Payment Dialog */}
      <SendPaymentDialog
        isOpen={isSendDialogOpen}
        onClose={handleSendDialogClose}
        initialParsedData={scannedPaymentData}
      />

      {/* Receive Payment Dialog */}
      <ReceivePaymentDialog
        isOpen={isReceiveDialogOpen}
        onClose={handleReceiveDialogClose}
      />

      {/* QR Scanner Dialog */}
      <QrScannerDialog
        isOpen={isQrScannerOpen}
        onClose={handleQrScannerClose}
        onScan={handleQrScan}
      />

      {/* Payment Details Dialog */}
      <PaymentDetailsDialog
        optionalPayment={selectedPayment}
        onClose={handlePaymentDetailsClose}
      />

      <div className="bottom-bar gap-x-8 h-16 bg-[var(--primary-blue)] shadow-lg flex items-center justify-center z-30">
        <button
          onClick={() => setIsSendDialogOpen(true)}
          className="flex items-center text-white px-4 py-2 rounded-lg hover:bg-[var(--secondary-blue)] transition-colors"
        >
          <span className="font-medium">Send</span>
        </button>

        <button
          onClick={() => setIsQrScannerOpen(true)}
          className="flex items-center justify-center text-white p-3 rounded-lg hover:bg-[var(--secondary-blue)] transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 13h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM19 19h2v2h-2z"/>
          </svg>
        </button>

        <button
          onClick={() => setIsReceiveDialogOpen(true)}
          className="flex items-center text-white px-4 py-2 rounded-lg hover:bg-[var(--secondary-blue)] transition-colors"
        >
          <span className="font-medium">Receive</span>
        </button>
      </div>
    </div>
  );
};

export default WalletPage;
