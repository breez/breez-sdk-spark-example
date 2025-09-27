import React from 'react';
import type { Config, GetInfoResponse, Network } from '@breeztech/breez-sdk-spark';

interface CollapsingWalletHeaderProps {
  walletInfo: GetInfoResponse | null;
  usdRate: number | null;
  scrollProgress: number;
  onOpenMenu: () => void;
  config: Config | null;
  onChangeNetwork: (network: Network) => void;
  hasUnclaimedDeposits: boolean;
  onOpenUnclaimedDeposits: () => void;
}

const CollapsingWalletHeader: React.FC<CollapsingWalletHeaderProps> = ({
  walletInfo,
  scrollProgress,
  usdRate,
  onOpenMenu,
  config,
  onChangeNetwork,
  hasUnclaimedDeposits,
  onOpenUnclaimedDeposits
}) => {
  if (!walletInfo) return null;

  // New WASM API has balanceSats directly on GetInfoResponse
  const balanceSat = walletInfo.balanceSats || 0;

  // Calculate opacity for pending amounts section (fade out first)
  const pendingOpacity = Math.max(0, 1 - scrollProgress * 2); // Fully transparent at 50% scroll

  // Calculate scale for the main balance (shrink after pending is gone)
  const balanceScale = scrollProgress > 0.5
    ? Math.max(0.8, 1 - (scrollProgress - 0.5)) // Scale down to 80% during the second half of scroll
    : 1; // Don't scale during first half

  // Height of the pending section when fully visible
  const maxPendingHeight = '80px';

  // Calculate USD value if rate is available
  const usdValue = usdRate !== null ? ((balanceSat / 100000000) * usdRate).toFixed(2) : null;

  return (
    <div className="card-no-border transition-all duration-200 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="text-[rgb(var(--text-white))]"
          aria-label="Open menu"
          title="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {config && (
          <select
            value={config.network}
            onChange={(e) => onChangeNetwork(e.currentTarget.value as Network)}
            className="bg-transparent border border-[rgb(var(--card-border))] rounded-md px-2 py-1 text-[rgb(var(--text-white))] text-sm opacity-80 capitalize focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-blue))]"
            title="Select Network"
          >
            <option className="bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))]" value="mainnet">Mainnet</option>
            <option className="bg-[rgb(var(--card-bg))] text-[rgb(var(--text-white))]" value="regtest">Regtest</option>
          </select>
        )}
      </div>
      {/* Top-right warning icon for unclaimed deposits */}
      {hasUnclaimedDeposits && (
        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
            title="There are unclaimed deposits that need attention"
            aria-label="Unclaimed deposits"
            onClick={onOpenUnclaimedDeposits}
          >
            {/* Exclamation triangle icon */}
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.6c.75 1.336-.213 3.001-1.742 3.001H3.48c-1.53 0-2.492-1.665-1.742-3.001l6.52-11.6zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      {/* Main Balance - always visible but scales down */}
      <div
        className="text-center transition-all duration-200 pt-12"
        style={{
          transform: `scale(${balanceScale})`,
          transformOrigin: 'center top'
        }}
      >
        <div className="text-4xl font-bold text-[rgb(var(--text-white))]">
          {balanceSat.toLocaleString()} sats
        </div>
      </div>

      {/* Pending Amounts - fade out and collapse */}
      <div
        className="flex flex-col overflow-hidden transition-all duration-200"
        style={{
          opacity: pendingOpacity,
          maxHeight: pendingOpacity > 0 ? maxPendingHeight : '0px',
          marginTop: pendingOpacity > 0 ? '1rem' : '0'
        }}
      >
        {/* USD Value - only show if we have a rate */}
        {usdValue && (
          <div className="text-center text-lg text-[rgb(var(--text-white))] opacity-75 mt-1">
            ${usdValue}
          </div>
        )}
      </div>

      {/* Add extra padding at the bottom to accommodate the floating buttons */}
      <div className="h-6"></div>
    </div>
  );
};

export default CollapsingWalletHeader;