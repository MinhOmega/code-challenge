export const BLOCKCHAIN_PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
} as const;

export type Blockchain = keyof typeof BLOCKCHAIN_PRIORITY | string;

export const DEFAULT_PRIORITY = -99;

export const getPriority = (blockchain: Blockchain): number => {
  return BLOCKCHAIN_PRIORITY[blockchain] ?? DEFAULT_PRIORITY;
};
