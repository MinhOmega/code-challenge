import { useState, useEffect } from 'react';

/**
 * Mock hook that returns current prices for currencies
 * In a real implementation, this would fetch prices from a price API
 */
export const usePrices = (): Record<string, number> => {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    // Mock price data - replace with actual API call
    const mockPrices: Record<string, number> = {
      OSMO: 0.95,
      ETH: 2500.0,
      ARB: 1.2,
      ZIL: 0.05,
      NEO: 12.5,
      MATIC: 0.85,
      USD: 1.0,
      BTC: 45000.0,
    };

    // Simulate async data fetching
    const timeoutId = setTimeout(() => {
      setPrices(mockPrices);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return prices;
};
