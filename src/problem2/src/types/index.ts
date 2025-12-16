export interface TokenPrice {
  currency: string;
  date: string;
  price: number;
}

export interface Token {
  currency: string;
  price: number;
  iconUrl: string;
}

export interface SwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  isLoading: boolean;
  error: string | null;
}

export type SwapDirection = 'from' | 'to';
