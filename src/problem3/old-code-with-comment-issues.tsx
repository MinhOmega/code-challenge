interface WalletBalance {
    currency: string
    amount: number
}
interface FormattedWalletBalance {
    currency: string
    amount: number
    formatted: string
}
//Unclear Props
// TODO: Add children?: React.ReactNode to Props.
interface Props extends BoxProps {}
const WalletPage: React.FC<Props> = (props: Props) => {
    const { children, ...rest } = props
    const balances = useWalletBalances()
    const prices = usePrices()

    //blockchain should not ANY, should be String
    const getPriority = (blockchain: any): number => {
        switch (blockchain) {
            case 'Osmosis':
                return 100
            case 'Ethereum':
                return 50
            case 'Arbitrum':
                return 30
            case 'Zilliqa':
                return 20
            case 'Neo':
                return 20
            default:
                return -99
        }
    }

    const sortedBalances = useMemo(() => {
        return balances
            .filter((balance: WalletBalance) => {
                const balancePriority = getPriority(balance.blockchain)
                //Incorrect Filtering Logic
                //TODO: should be balancePriority
                if (lhsPriority > -99) {
                    if (balance.amount <= 0) {
                        return true
                    }
                }
                return false
            })
            .sort((lhs: WalletBalance, rhs: WalletBalance) => {
                const leftPriority = getPriority(lhs.blockchain)
                const rightPriority = getPriority(rhs.blockchain)
                if (leftPriority > rightPriority) {
                    return -1
                } else if (rightPriority > leftPriority) {
                    return 1
                }
            })
        //Incorrect Hook Dependency
        // TODO: prices isn't used in useMemo. Unnecessary dependency. Remove prices
    }, [balances, prices])

    // TODO: Unused, should remove this
    const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
        return {
            ...balance,
            formatted: balance.amount.toFixed(),
        }
    })

    const rows = sortedBalances.map(
        //Incorrect Type Usage
        // TODO: Type says FormattedWalletBalance, but sortedBalances is WalletBalance[]
        (balance: FormattedWalletBalance, index: number) => {
            const usdValue = prices[balance.currency] * balance.amount
            return (
                <WalletRow
                    className={classes.row}
                    //Using Index as key in .map(), Leads to unnecessary re-renders or UI bugs if list order changes
                    //TODO: change to balance.currency
                    key={index}
                    amount={balance.amount}
                    usdValue={usdValue}
                    formattedAmount={balance.formatted}
                />
            )
        }
    )

    return <div {...rest}>{rows}</div>
}
