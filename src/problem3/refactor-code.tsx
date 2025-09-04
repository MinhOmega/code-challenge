/**
 * WalletPage – Refactor with performance and correctness fixes
 *
 * Issues identified in the original snippet:
 * - Type safety: `blockchain` missing on WalletBalance; `getPriority` param typed as `any`.
 * - Filtering bug: used an undefined `lhsPriority` and returned true for non-positive amounts.
 * - Comparator: no return for equal priority; inconsistent comparator contract.
 * - useMemo dependency: depended on `prices` though not used, causing needless recalculations.
 * - Unused work: built `formattedBalances` but never used it.
 * - Key anti-pattern: used array index as React key; unstable across reorders.
 * - Type mismatch: mapped `WalletBalance[]` as `FormattedWalletBalance`, then accessed `formatted` that didn’t exist.
 * - Missing price handling: not every token has a price; NaN propagation risk.
 * - Minor: destructured `children` in props but didn’t render it; ambiguous Props.
 *
 * Refactor highlights:
  * - Stronger types and a constant-time priority lookup map.
  * - Correct filter (positive balances on supported chains) and stable sort.
  * - Memoize both the sorted list and the rendered rows with precise dependencies.
  * - Stable keys (currency) and safe price fallback.
  * - Render `children` to preserve Box-like composition.
  *
  * Further improvements (not shown to keep scope tight):
  * - Precompute and cache priorities alongside balances upstream to avoid repeated lookups.
  * - Add Suspense/loading and error states around `usePrices()` and `useWalletBalances()`.
  * - Virtualize long lists (e.g. react-window) if balances can be large.
  * - i18n/locale-aware number formatting via `Intl.NumberFormat`.
 */

interface WalletBalance {
    currency: string
    amount: number
    blockchain: string
}

interface Props extends BoxProps {
    children?: React.ReactNode
}

type PriceMap = Record<string, number>

const PRIORITY_MAP: Record<string, number> = {
    Osmosis: 100,
    Ethereum: 50,
    Arbitrum: 30,
    Zilliqa: 20,
    Neo: 20,
}

const getPriority = (blockchain: string): number => PRIORITY_MAP[blockchain] ?? -99

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
    const balances = useWalletBalances() as WalletBalance[]
    const prices = usePrices() as PriceMap

  // Keep only supported chains with a positive amount, and sort by chain priority (desc)
    const sortedBalances = useMemo(() => {
        return balances
        .filter((b) => getPriority(b.blockchain) > -99 && b.amount > 0)
        .sort((a, b) => {
            const ap = getPriority(a.blockchain)
            const bp = getPriority(b.blockchain)
            return bp - ap
        })
    }, [balances])

  // Derive rows (depends on prices for USD valuation)
    const rows = useMemo(() => {
        return sortedBalances
        .filter((b) => prices?.[b.currency] != null)
        .map((balance) => {
            const price = prices[balance.currency]!
            const usdValue = price * balance.amount
            const formattedAmount = balance.amount.toFixed(4)
            return (
            <WalletRow
                className="row"
                key={balance.currency}
                amount={balance.amount}
                usdValue={usdValue}
                formattedAmount={formattedAmount}
            />
            )
        })
    }, [sortedBalances, prices])

    return (
        <div {...rest}>
        {rows}
        {children}
        </div>
    )
}

export default WalletPage
