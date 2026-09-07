import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FundStep } from './FundStep';

const props = {
  address: 'bcrt1qfund',
  requiredSat: 5_898,
  fundedSat: 0,
  isFunded: false,
  hasPendingDeposit: false,
  isResuming: false,
  onBack: vi.fn(),
  onContinue: vi.fn(),
};

describe('FundStep', () => {
  it('names the amount a fresh exit needs', () => {
    render(<FundStep {...props} />);
    expect(screen.getAllByText(/5 898/).length).toBeGreaterThan(0);
  });

  it('does not quote a fresh exit price to an exit already under way', () => {
    // Most of a resumed exit is already on-chain, so the quote's figure would
    // ask for money the remaining work does not need.
    render(<FundStep {...props} isResuming fundedSat={3_905} isFunded />);
    expect(screen.queryByText(/5 898/)).not.toBeInTheDocument();
    expect(screen.getByText(/already at this address/i)).toBeInTheDocument();
  });
});
