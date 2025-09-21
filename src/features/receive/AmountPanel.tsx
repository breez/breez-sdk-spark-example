import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FormGroup, FormInput, FormError, PrimaryButton } from '../../components/ui';

interface AmountPanelProps {
  isOpen: boolean;
  amount: string;
  setAmount: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  limits: { min: number; max: number };
  isLoading: boolean;
  error: string | null;
  onCreateInvoice: () => void;
  onClose: () => void;
}

const AmountPanel: React.FC<AmountPanelProps> = ({
  isOpen,
  amount,
  setAmount,
  description,
  setDescription,
  limits,
  isLoading,
  error,
  onCreateInvoice,
  onClose,
}) => {
  return (
    <div className="relative">
      <div
        className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-600 transition-transform duration-300 ease-in-out z-40 shadow-lg ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: 'calc(100vh - 200px)', maxHeight: '400px' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-[rgb(var(--text-white))]">Create Invoice</h4>
            <button onClick={onClose} className="text-[rgb(var(--text-white))] opacity-75 hover:opacity-100 p-1">
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
            <PrimaryButton onClick={onCreateInvoice} disabled={isLoading} className="w-full">
              {isLoading ? <LoadingSpinner text="Generating invoice..." size="small" /> : 'Generate'}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Backdrop overlay when panel is open */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-30" onClick={onClose} />}
    </div>
  );
};

export default AmountPanel;
