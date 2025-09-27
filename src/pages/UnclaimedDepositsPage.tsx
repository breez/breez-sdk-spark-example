import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import type { DepositInfo, Fee, SdkEvent } from '@breeztech/breez-sdk-spark';
import { LoadingSpinner, PrimaryButton, Alert, FormGroup, FormInput, FormError } from '../components/ui';
import { Transition } from '@headlessui/react';

interface UnclaimedDepositsPageProps {
  onBack: () => void;
  onChanged?: () => void; // refresh the header indicator in parent after a claim
}

const UnclaimedDepositsPage: React.FC<UnclaimedDepositsPageProps> = ({ onBack, onChanged }) => {
  const wallet = useWallet();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<DepositInfo[]>([]);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<'claim' | 'refund' | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isFeePanelOpen, setIsFeePanelOpen] = useState<boolean>(false);
  const [feeType, setFeeType] = useState<'fixed' | 'relative'>('fixed');
  const [feeValue, setFeeValue] = useState<string>('1');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositInfo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'claim' | 'refund'>('claim');
  const [destination, setDestination] = useState<string>('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await wallet.unclaimedDeposits();
      setDeposits(list);
    } catch (e) {
      console.error('Failed to load unclaimed deposits:', e);
      setError('Failed to load unclaimed deposits');
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh deposits on every sync-related SDK event while this page is open
  useEffect(() => {
    let listenerId: string | null = null;
    (async () => {
      try {
        listenerId = await wallet.addEventListener((event: SdkEvent) => {
          if (event.type === 'synced' || event.type === 'claimDepositsSucceeded' || event.type === 'claimDepositsFailed') {
            void load();
          }
        });
      } catch (e) {
        console.warn('Failed to attach deposits page event listener:', e);
      }
    })();

    return () => {
      if (listenerId) {
        wallet.removeEventListener(listenerId).catch(() => { });
      }
    };
  }, [wallet, load]);

  const handleClaim = async (txid: string, vout: number, maxFee: Fee) => {
    setError(null);
    try {
      await wallet.claimDeposit(txid, vout, maxFee);
      await load();
      onChanged?.();
    } catch (e) {
      console.error('Failed to claim deposit:', e);
      setError(e instanceof Error ? e.message : 'Failed to claim deposit');
    } finally {
      setProcessingIndex(null);
      setProcessingAction(null);
    }
  };

  const handleRefund = async (txid: string, vout: number, destinationAddress: string, fee: Fee) => {
    setError(null);
    try {
      await wallet.refundDeposit(txid, vout, destinationAddress, fee);
      await load();
      onChanged?.();
    } catch (e) {
      console.error('Failed to refund deposit:', e);
      setError(e instanceof Error ? e.message : 'Failed to refund deposit');
    } finally {
      setProcessingIndex(null);
      setProcessingAction(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Wait for leave transition to finish before navigating back
    setTimeout(() => onBack(), 220);
  };

  return (
    <div className="absolute inset-0 z-50 overflow-hidden">
      <Transition
        show={isOpen}
        appear
        as="div"
        className="absolute inset-0"
      >
        <Transition.Child
          as="div"
          enter="transform transition ease-out duration-300"
          enterFrom="translate-y-full"
          enterTo="translate-y-0"
          leave="transform transition ease-in duration-200"
          leaveFrom="translate-y-0"
          leaveTo="translate-y-full"
          className="absolute inset-0"
        >
          <div className="flex flex-col h-full bg-[var(--card-bg)]">
            {/* Header with close icon */}
            <div className="relative px-4 py-3">
              <h1 className="text-center text-lg font-semibold text-[rgb(var(--text-white))]">Unclaimed Deposits</h1>
              <button
                onClick={handleClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-white))] hover:text-[rgb(var(--accent-red))] text-2xl"
                aria-label="Close"
                title="Close"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-4">
              {isLoading && (
                <div className="py-10 flex justify-center">
                  <LoadingSpinner text="Loading deposits..." />
                </div>
              )}

              {error && <Alert type="error">{error}</Alert>}

              {!isLoading && deposits.length === 0 && (
                <Alert type="info">No unclaimed deposits found.</Alert>
              )}

              {!isLoading && deposits.length > 0 && (
                <div className="space-y-3">
                  {deposits.map((dep, idx) => {
                    const amount = dep.amountSats;
                    const id = dep.txid;
                    const hasRefundTx = Boolean((dep as any).refund_tx_id || (dep as any).refundTxId || (dep as any).refund_txid || (dep as any).refundTxid);
                    return (
                      <div key={idx} className="p-4 rounded-lg border border-[rgb(var(--card-border))] bg-[rgb(var(--card-bg))]">
                        <div className="flex flex-col h-full">
                          <div className="pr-3">
                            <div className="text-[rgb(var(--text-white))] font-medium break-all">Tx: {id}</div>
                            <div className="text-sm text-[rgb(var(--text-white))] opacity-80">
                              {typeof amount === 'number' ? `${amount} sats` : 'Amount: unknown'}
                            </div>
                            {hasRefundTx && (
                              <div className="mt-1 inline-flex items-center text-xs text-[rgb(var(--text-white))] opacity-70">
                                Refunded
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-[rgb(var(--card-border))] flex items-center justify-center gap-3">
                            <PrimaryButton
                              onClick={() => { setSelectedDeposit(dep); setSelectedIndex(idx); setActionType('claim'); setIsFeePanelOpen(true); setFeeError(null); setFeeValue('1'); setFeeType('fixed'); setDestination(''); }}
                              disabled={processingIndex === idx || hasRefundTx}
                              className="px-4 py-1.5 text-sm w-36 whitespace-nowrap"
                            >
                              {processingIndex === idx && processingAction === 'claim' ? 'Claiming…' : 'Claim Now'}
                            </PrimaryButton>
                            <PrimaryButton
                              onClick={() => { setSelectedDeposit(dep); setSelectedIndex(idx); setActionType('refund'); setIsFeePanelOpen(true); setFeeError(null); setFeeValue('1'); setFeeType('fixed'); setDestination(''); }}
                              disabled={processingIndex === idx}
                              className="px-4 py-1.5 text-sm w-36 whitespace-nowrap"
                            >
                              {processingIndex === idx && processingAction === 'refund' ? 'Refunding…' : 'Refund'}
                            </PrimaryButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Transition.Child>
      </Transition>
      {/* Sliding bottom panel for fee selection */}
      <div className="relative">
        <div
          className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-600 transition-transform duration-300 ease-in-out z-50 shadow-lg ${isFeePanelOpen ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ height: 'calc(100vh - 200px)', maxHeight: '360px' }}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-[rgb(var(--text-white))]">Set Max Fee</h4>
              <button onClick={() => { setIsFeePanelOpen(false); setProcessingIndex(null); }} className="text-[rgb(var(--text-white))] opacity-75 hover:opacity-100 p-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <FormGroup>
                {/* Fee type selector */}
                <div className="flex gap-2 mb-2">
                  <button
                    className={`px-3 py-1 rounded ${feeType === 'fixed' ? 'bg-[var(--primary-blue)] text-white' : 'bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))]'}`}
                    onClick={() => setFeeType('fixed')}
                    type="button"
                  >
                    Absolute (sats)
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${feeType === 'relative' ? 'bg-[var(--primary-blue)] text-white' : 'bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))]'}`}
                    onClick={() => setFeeType('relative')}
                    type="button"
                  >
                    Relative (%)
                  </button>
                </div>

                {/* Fee value input */}
                <div>
                  <FormInput
                    id="fee-value"
                    type="number"
                    min={0}
                    value={feeValue}
                    onChange={(e) => setFeeValue(e.target.value)}
                    placeholder={feeType === 'fixed' ? 'Max fee in sats' : 'Max fee in %'}
                  />
                </div>

                {/* Destination address input for refund */}
                {actionType === 'refund' && (
                  <div className="mt-3">
                    <FormInput
                      id="refund-destination"
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Destination address"
                    />
                  </div>
                )}

                <FormError error={feeError} />
              </FormGroup>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-600">
              <PrimaryButton
                onClick={async () => {
                  if (!selectedDeposit) { setFeeError('No deposit selected'); return; }
                  const n = Number(feeValue);
                  if (Number.isNaN(n) || n < 0) {
                    setFeeError('Please enter a valid fee');
                    return;
                  }
                  if (actionType === 'refund' && (!destination || destination.trim().length === 0)) {
                    setFeeError('Destination address is required');
                    return;
                  }
                  setFeeError(null);
                  try {
                    const maxFee: Fee = feeType === 'fixed'
                      ? { type: 'fixed', amount: Math.floor(n) }
                      // Relative shape may vary across SDK versions; using a permissive cast for now
                      : ({ type: 'relative', percentage: n } as unknown as Fee);
                    const idx = selectedIndex ?? deposits.findIndex(d => d.txid === selectedDeposit.txid && d.vout === selectedDeposit.vout);
                    if (idx >= 0) setProcessingIndex(idx);
                    setProcessingAction(actionType);
                    if (actionType === 'claim') {
                      await handleClaim(selectedDeposit.txid, selectedDeposit.vout, maxFee);
                    } else {
                      await handleRefund(selectedDeposit.txid, selectedDeposit.vout, destination.trim(), maxFee);
                    }
                    setIsFeePanelOpen(false);
                  } catch (e) {
                    // handleClaim already sets errors
                  }
                }}
                className="w-full"
              >
                {actionType === 'refund' ? 'Refund Now' : 'Claim Now'}
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Backdrop overlay */}
        {isFeePanelOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => { setIsFeePanelOpen(false); setProcessingIndex(null); }} />}
      </div>
    </div>
  );
}
  ;

export default UnclaimedDepositsPage;
