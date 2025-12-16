import React, { memo } from 'react';

interface WalletRowProps {
  className?: string;
  currency: string;
  blockchain: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}

/**
 * Component that displays a single wallet row with balance information
 * Memoized to prevent unnecessary re-renders when props haven't changed
 */
export const WalletRow: React.FC<WalletRowProps> = memo(
  ({ className, currency, blockchain, amount, usdValue, formattedAmount }) => {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          marginBottom: '8px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
        }}
      >
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {currency}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {blockchain} • {formattedAmount}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1976d2' }}>
            ${usdValue.toFixed(2)}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {amount.toFixed(4)} tokens
          </div>
        </div>
      </div>
    );
  }
);

WalletRow.displayName = 'WalletRow';
