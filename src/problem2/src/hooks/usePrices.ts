import { useState, useEffect, useCallback } from 'react';
import type { Token, TokenPrice } from '@/types';

const PRICES_API_URL = 'https://interview.switcheo.com/prices.json';
const TOKEN_ICON_BASE_URL = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens';

export function usePrices() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(PRICES_API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const data: TokenPrice[] = await response.json();

      // Process and deduplicate tokens, keeping the most recent price
      const tokenMap = new Map<string, Token>();

      data.forEach((item) => {
        // Skip tokens without price
        if (!item.price || item.price <= 0) return;

        const existing = tokenMap.get(item.currency);
        const itemDate = new Date(item.date);

        if (!existing || itemDate > new Date(existing.price)) {
          tokenMap.set(item.currency, {
            currency: item.currency,
            price: item.price,
            iconUrl: `${TOKEN_ICON_BASE_URL}/${item.currency}.svg`,
          });
        }
      });

      // Sort tokens alphabetically
      const sortedTokens = Array.from(tokenMap.values()).sort((a, b) =>
        a.currency.localeCompare(b.currency)
      );

      setTokens(sortedTokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const getTokenBySymbol = useCallback(
    (symbol: string): Token | undefined => {
      return tokens.find((t) => t.currency === symbol);
    },
    [tokens]
  );

  const calculateExchangeRate = useCallback(
    (fromToken: Token | null, toToken: Token | null): number | null => {
      if (!fromToken || !toToken) return null;
      return fromToken.price / toToken.price;
    },
    []
  );

  return {
    tokens,
    isLoading,
    error,
    refetch: fetchPrices,
    getTokenBySymbol,
    calculateExchangeRate,
  };
}
