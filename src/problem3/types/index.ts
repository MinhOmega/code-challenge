import type { Blockchain } from '../constants/blockchain';

export interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

export interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

export interface BoxProps {
  className?: string;
  children?: React.ReactNode;
}
