import { useState, useEffect } from 'react';
import type { WalletBalance } from '../types';

/**
 * Mock hook that returns wallet balances
 * In a real implementation, this would fetch data from an API or blockchain
 */
export const useWalletBalances = (): WalletBalance[] => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockBalances: WalletBalance[] = [
      { currency: 'OSMO', amount: 100.5, blockchain: 'Osmosis' },
      { currency: 'ETH', amount: 2.3, blockchain: 'Ethereum' },
      { currency: 'ARB', amount: 0, blockchain: 'Arbitrum' }, // Zero balance - should be filtered
      { currency: 'ZIL', amount: 50.75, blockchain: 'Zilliqa' },
      { currency: 'NEO', amount: 25.0, blockchain: 'Neo' },
      { currency: 'MATIC', amount: 10.2, blockchain: 'Polygon' }, // Unknown blockchain
      { currency: 'ETH2', amount: -5, blockchain: 'Ethereum' }, // Negative - should be filtered
    ];

    // Simulate async data fetching
    const timeoutId = setTimeout(() => {
      setBalances(mockBalances);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return balances;
};
