interface WalletBalance {
    currency: string
    amount: number
    blockchain: string
}

interface Props extends BoxProps {
    children?: React.ReactNode
}

const PRIORITY_MAP: Record<string, number> = {
    Osmosis: 100,
    Ethereum: 50,
    Arbitrum: 30,
    Zilliqa: 20,
    Neo: 20,
}

const getPriority = (blockchain: string): number =>
    PRIORITY_MAP[blockchain] ?? -99

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
    const balances = useWalletBalances()
    const prices = usePrices()

    const sortedBalances = useMemo(() => {
        return balances
            .filter(
                (balance) => getPriority(balance.blockchain) > -99 && balance.amount > 0
            )
            .sort((a, b) => getPriority(b.blockchain) - getPriority(a.blockchain))
    }, [balances])

    const rows = sortedBalances.map((balance) => {
        const usdValue = prices[balance.currency] * balance.amount
        const formattedAmount = balance.amount.toFixed()
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

    return <div {...rest}>{rows}</div>
}

export default WalletPage
