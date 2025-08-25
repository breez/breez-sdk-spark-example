import React from 'react';
import { Payment } from '../wasm/breez_sdk_spark_wasm.js';

interface TransactionListProps {
  transactions: Payment[];
  onPaymentSelected: (payment: Payment) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onPaymentSelected }) => {
  if (!transactions.length) {
    return null;
  }

  // Format relative time (time ago)
  const formatTimeAgo = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const diffSeconds = now - timestamp;

    // Convert to appropriate time unit
    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffSeconds < 2592000) { // 30 days
      const days = Math.floor(diffSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffSeconds < 31536000) { // 365 days
      const months = Math.floor(diffSeconds / 2592000);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffSeconds / 31536000);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  // Get transaction icon based on type
  const getTransactionIcon = (payment: Payment): string => {
    if (payment.paymentType === 'receive') {
      return '+';
    } else if (payment.paymentType === 'send') {
      return '−'; // Using minus sign (not hyphen) for better visual
    }
    return '•';
  };

  // Get transaction color based on type and status
  const getTransactionColor = (payment: Payment): string => {
    if (payment.status === 'failed') {
      return 'text-[rgb(var(--accent-red))]';
    } else if (payment.status === 'pending') {
      return 'text-yellow-400';
    } else if (payment.paymentType === 'receive') {
      return 'text-[rgb(var(--accent-green))]';
    } else {
      return 'text-[rgb(var(--accent-red))]';
    }
  };

  // Get short description from payment details
  const getDescription = (payment: Payment): string => {
    let description = '';

    if (payment.method == 'lightning') {
      if (payment.details?.type == 'lightning') {
        description = payment.details?.description || 'Lightning Payment';
      } else {
        description = 'Lightning Payment';
      }
    } else if (payment.method == 'spark') {
      description = "Spark Transfer"
    } else if (payment.method == 'deposit') {
      description = "Deposit"
    } else if (payment.method == 'withdraw') {
      description = "Withdraw"
    }

    return description || 'Unknown Payment';
  };

  return (
    <div className="card-no-border">
      <ul className="space-y-2">
        {transactions.map((tx) => (
          <li
            key={tx.id || `${tx.timestamp}-${tx.amount}`}
            className="list-item flex justify-between items-center py-2 px-3 hover:bg-[rgb(var(--card-border))] cursor-pointer transition-colors"
            onClick={() => onPaymentSelected(tx)}
          >
            <div className="flex flex-none items-center space-x-3">
              <div className={`w-8 h-8 rounded-full bg-[rgb(var(--card-border))] flex items-center justify-center ${getTransactionColor(tx)}`}>
                <span className="text-lg font-bold">{getTransactionIcon(tx)}</span>
              </div>
              <div className="flex flex-none flex-col">
                <p className="text-sm text-[rgb(var(--text-white))]">{getDescription(tx)}</p>
                <p className="text-[rgb(var(--text-white))] opacity-70 text-xs">{formatTimeAgo(tx.timestamp)} {tx.status === 'pending' && <span className='text-yellow-400'>(Pending)</span>}</p>
              </div>

              <div className="ml-auto pl-3 flex-1">
                <div className="flex flex-col items-end justify-center">
                  <p className={`font-medium text-sm ${tx.paymentType === 'receive' ? 'text-[rgb(var(--accent-green))]' : 'text-[rgb(var(--accent-red))]'}`}>
                    {tx.paymentType === 'receive' ? '+' : '-'} {tx.amount.toLocaleString()}
                  </p>
                  {tx.fees > 0 && <p className="text-[rgb(var(--text-white))] opacity-70 text-xs">Fee {tx.fees}</p>}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionList;
