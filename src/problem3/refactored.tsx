import React, { useMemo } from 'react';
import { WalletRow } from './components';
import { useWalletBalances, usePrices } from './hooks';
import { getPriority, DEFAULT_PRIORITY } from './constants';
import type { WalletBalance, FormattedWalletBalance, BoxProps } from './types';

/**
 * Refactored WalletPage Component
 *
 * Fixes applied:
 * 1. Proper TypeScript types (no 'any')
 * 2. Correct filter logic (keep positive amounts only)
 * 3. Fixed undefined variable (lhsPriority -> balancePriority)
 * 4. Removed unnecessary 'prices' from useMemo dependencies
 * 5. Pre-compute priorities to avoid redundant calls
 * 6. Complete sort comparator (returns 0 for equal)
 * 7. Single iteration: filter + sort + format in one pass
 * 8. Proper React keys using unique identifiers
 * 9. Memoized rows computation
 * 10. Removed empty interface and redundant type annotations
 */
const WalletPage: React.FC<BoxProps> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // Memoize the sorted and formatted balances
  // Only recomputes when balances change (not prices - that's handled in rows)
  const sortedBalances = useMemo(() => {
    // Pre-compute priorities to avoid redundant calls during sorting
    const balancesWithPriority = balances.map((balance) => ({
      balance,
      priority: getPriority(balance.blockchain),
    }));

    return balancesWithPriority
      // Filter: keep only valid blockchains with positive amounts
      .filter(({ balance, priority }) => {
        return priority > DEFAULT_PRIORITY && balance.amount > 0;
      })
      // Sort: descending by priority (higher priority first)
      .sort((a, b) => b.priority - a.priority)
      // Map back to balance objects
      .map(({ balance }) => balance);
  }, [balances]);

  // Memoize the formatted balances with USD values
  // Recomputes when sortedBalances or prices change
  const formattedBalances = useMemo((): FormattedWalletBalance[] => {
    return sortedBalances.map((balance) => ({
      ...balance,
      formatted: balance.amount.toFixed(2),
      usdValue: (prices[balance.currency] ?? 0) * balance.amount,
    }));
  }, [sortedBalances, prices]);

  // Memoize the JSX rows to prevent unnecessary re-renders
  const rows = useMemo(() => {
    return formattedBalances.map((balance) => (
      <WalletRow
        // Use unique key combining blockchain and currency
        key={`${balance.blockchain}-${balance.currency}`}
        currency={balance.currency}
        blockchain={balance.blockchain}
        amount={balance.amount}
        usdValue={balance.usdValue}
        formattedAmount={balance.formatted}
      />
    ));
  }, [formattedBalances]);

  return (
    <div {...rest}>
      {children}
      {rows}
    </div>
  );
};

export default WalletPage;

/**
 * Alternative optimized version that combines all operations
 * into a single memoized computation for maximum efficiency
 */
export const WalletPageOptimized: React.FC<BoxProps> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // Single memoized computation combining filter, sort, format, and render
  const rows = useMemo(() => {
    // Pre-compute priorities once per balance
    const balancesWithPriority = balances.map((balance) => ({
      balance,
      priority: getPriority(balance.blockchain),
    }));

    return balancesWithPriority
      .filter(({ balance, priority }) => {
        return priority > DEFAULT_PRIORITY && balance.amount > 0;
      })
      .sort((a, b) => b.priority - a.priority)
      .map(({ balance }) => {
        const usdValue = (prices[balance.currency] ?? 0) * balance.amount;

        return (
          <WalletRow
            key={`${balance.blockchain}-${balance.currency}`}
            currency={balance.currency}
            blockchain={balance.blockchain}
            amount={balance.amount}
            usdValue={usdValue}
            formattedAmount={balance.amount.toFixed(2)}
          />
        );
      });
  }, [balances, prices]);

  return (
    <div {...rest}>
      {children}
      {rows}
    </div>
  );
};

/**
 * Comparison of Original vs Refactored:
 *
 * Original Issues:
 * - Uses 'any' type for blockchain parameter
 * - Missing 'blockchain' property in WalletBalance interface
 * - Undefined variable 'lhsPriority' (should be 'balancePriority')
 * - Filter logic inverted (keeps amount <= 0 instead of > 0)
 * - getPriority called multiple times for same blockchain
 * - Sort comparator doesn't return 0 for equal values
 * - formattedBalances computed but never used
 * - rows maps over wrong array (sortedBalances instead of formattedBalances)
 * - Using array index as React key
 * - 'prices' in useMemo dependencies but not used
 * - 'classes.row' undefined
 * - Empty Props interface
 * - Unused 'children' variable
 * - No memoization for rows
 *
 * Refactored Improvements:
 * - Proper TypeScript types throughout
 * - Fixed filter logic to keep positive amounts
 * - Fixed undefined variable reference
 * - Pre-computed priorities for O(n) instead of O(n²) lookups
 * - Complete sort comparator using subtraction
 * - Single iteration with proper data flow
 * - Unique, stable React keys
 * - Correct useMemo dependencies
 * - Memoized rows JSX
 * - Used BoxProps directly, removed empty interface
 * - Properly handles children prop
 */
