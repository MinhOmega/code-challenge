import { useState, useEffect, useCallback } from 'react';
import { ArrowDownUp, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SwapInput } from './SwapInput';
import { usePrices } from '@/hooks/usePrices';
import type { Token, SwapDirection } from '@/types';

export function SwapForm() {
  const { tokens, isLoading: isLoadingTokens, error, refetch } = usePrices();

  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [lastEdited, setLastEdited] = useState<SwapDirection>('from');
  const [isSwapping, setIsSwapping] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Set default tokens when loaded
  useEffect(() => {
    if (tokens.length > 0 && !fromToken && !toToken) {
      const eth = tokens.find((t) => t.currency === 'ETH');
      const usdc = tokens.find((t) => t.currency === 'USDC');
      if (eth) setFromToken(eth);
      if (usdc) setToToken(usdc);
    }
  }, [tokens, fromToken, toToken]);

  // Calculate exchange amounts with debounce effect
  const calculateToAmount = useCallback(
    (amount: string) => {
      if (!fromToken || !toToken || !amount || isNaN(parseFloat(amount))) {
        setToAmount('');
        return;
      }

      setIsCalculating(true);
      // Simulate a small delay for realistic UX
      setTimeout(() => {
        const rate = fromToken.price / toToken.price;
        const result = parseFloat(amount) * rate;
        setToAmount(result.toFixed(6));
        setIsCalculating(false);
      }, 300);
    },
    [fromToken, toToken]
  );

  const calculateFromAmount = useCallback(
    (amount: string) => {
      if (!fromToken || !toToken || !amount || isNaN(parseFloat(amount))) {
        setFromAmount('');
        return;
      }

      setIsCalculating(true);
      setTimeout(() => {
        const rate = toToken.price / fromToken.price;
        const result = parseFloat(amount) * rate;
        setFromAmount(result.toFixed(6));
        setIsCalculating(false);
      }, 300);
    },
    [fromToken, toToken]
  );

  // Recalculate when tokens change
  useEffect(() => {
    if (lastEdited === 'from' && fromAmount) {
      calculateToAmount(fromAmount);
    } else if (lastEdited === 'to' && toAmount) {
      calculateFromAmount(toAmount);
    }
  }, [
    fromToken,
    toToken,
    lastEdited,
    fromAmount,
    toAmount,
    calculateToAmount,
    calculateFromAmount,
  ]);

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setLastEdited('from');
    calculateToAmount(value);
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    setLastEdited('to');
    calculateFromAmount(value);
  };

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setLastEdited(lastEdited === 'from' ? 'to' : 'from');
  };

  const handleSubmit = async () => {
    // Validation
    if (!fromToken || !toToken) {
      toast.error('Please select both tokens');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (fromToken.currency === toToken.currency) {
      toast.error('Please select different tokens');
      return;
    }

    setIsSwapping(true);

    // Simulate swap transaction
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        `Successfully swapped ${fromAmount} ${fromToken.currency} to ${toAmount} ${toToken.currency}`,
        {
          description: 'Transaction completed',
        }
      );

      // Reset form
      setFromAmount('');
      setToAmount('');
    } catch {
      toast.error('Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  const exchangeRate =
    fromToken && toToken
      ? (fromToken.price / toToken.price).toFixed(6)
      : null;

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-10">
          <p className="text-destructive">Failed to load token prices</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Swap
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={refetch}
            disabled={isLoadingTokens}
          >
            <RefreshCw
              className={`size-4 ${isLoadingTokens ? 'animate-spin' : ''}`}
            />
          </Button>
        </CardTitle>
        <CardDescription>
          Swap tokens instantly at the best rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingTokens ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SwapInput
              label="You pay"
              tokens={tokens}
              selectedToken={fromToken}
              onTokenSelect={setFromToken}
              amount={fromAmount}
              onAmountChange={handleFromAmountChange}
              excludeToken={toToken}
              disabled={isSwapping}
              isLoading={isCalculating && lastEdited === 'to'}
            />

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={handleSwapTokens}
                disabled={isSwapping || !fromToken || !toToken}
              >
                <ArrowDownUp className="size-4" />
              </Button>
            </div>

            <SwapInput
              label="You receive"
              tokens={tokens}
              selectedToken={toToken}
              onTokenSelect={setToToken}
              amount={toAmount}
              onAmountChange={handleToAmountChange}
              excludeToken={fromToken}
              disabled={isSwapping}
              isLoading={isCalculating && lastEdited === 'from'}
            />

            {exchangeRate && fromToken && toToken && (
              <div className="rounded-lg bg-muted/50 p-3 text-center text-sm">
                <span className="text-muted-foreground">
                  1 {fromToken.currency} = {exchangeRate} {toToken.currency}
                </span>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={
                isSwapping ||
                !fromToken ||
                !toToken ||
                !fromAmount ||
                parseFloat(fromAmount) <= 0
              }
            >
              {isSwapping ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Swapping...
                </>
              ) : (
                'Swap'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
