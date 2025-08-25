import React, { useRef, useState, useCallback } from 'react';
import { Config, GetInfoResponse, Payment } from '../wasm/breez_sdk_spark_wasm.js';
import * as walletService from '../services/walletService';
import CollapsingWalletHeader from '../components/CollapsingWalletHeader';
import TransactionList from '../components/TransactionList';
import LoadingSpinner from '../components/LoadingSpinner';
import SendPaymentDialog from '../components/SendPaymentDialog';
import ReceivePaymentDialog from '../components/ReceivePaymentDialog';
import PaymentDetailsDialog from '../components/PaymentDetailsDialog';

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
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState<boolean>(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

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
    // Refresh wallet data to show any new transactions
    refreshWalletData(false);
  }, [refreshWalletData]);

  // Handler for closing the receive dialog and refreshing data
  const handleReceiveDialogClose = useCallback(() => {
    setIsReceiveDialogOpen(false);
    // Refresh wallet data to show any new transactions
    refreshWalletData(false);
  }, [refreshWalletData]);

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
        walletService={walletService}
        transactionsListRef={transactionsContainerRef}
      />

      {/* Receive Payment Dialog */}
      <ReceivePaymentDialog
        isOpen={isReceiveDialogOpen}
        onClose={handleReceiveDialogClose}
        walletService={walletService}
      />

      {/* Payment Details Dialog */}
      <PaymentDetailsDialog
        optionalPayment={selectedPayment}
        onClose={handlePaymentDetailsClose}
      />

      <div className="bottom-bar gap-x-16 h-16 bg-[var(--primary-blue)] shadow-lg flex items-center justify-center z-30">
        <button
          onClick={() => setIsSendDialogOpen(true)}
          className="flex items-center text-white px-4 py-2 rounded-lg hover:bg-[var(--secondary-blue)] transition-colors"
        >
          <span className="text-xl mr-2">↑</span>
          <span className="font-medium">Send</span>
        </button>

        <button
          onClick={() => setIsReceiveDialogOpen(true)}
          className="flex items-center text-white px-4 py-2 rounded-lg hover:bg-[var(--secondary-blue)] transition-colors"
        >
          <span className="text-xl mr-2">↓</span>
          <span className="font-medium">Receive</span>
        </button>
      </div>
    </div>
  );
};

export default WalletPage;
