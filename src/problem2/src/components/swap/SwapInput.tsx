import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TokenSelector } from './TokenSelector';
import type { Token } from '@/types';

interface SwapInputProps {
  label: string;
  tokens: Token[];
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  excludeToken?: Token | null;
  disabled?: boolean;
  readOnly?: boolean;
  isLoading?: boolean;
}

export function SwapInput({
  label,
  tokens,
  selectedToken,
  onTokenSelect,
  amount,
  onAmountChange,
  excludeToken,
  disabled = false,
  readOnly = false,
  isLoading = false,
}: SwapInputProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  const usdValue =
    selectedToken && amount && !isNaN(parseFloat(amount))
      ? (parseFloat(amount) * selectedToken.price).toFixed(2)
      : null;

  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex-1 space-y-1">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountChange}
            disabled={disabled}
            readOnly={readOnly}
            className={`h-auto border-0 bg-transparent p-0 text-2xl font-semibold shadow-none focus-visible:ring-0 ${
              isLoading ? 'animate-pulse' : ''
            }`}
          />
          {usdValue && (
            <span className="text-xs text-muted-foreground">
              ≈ ${usdValue} USD
            </span>
          )}
        </div>
        <TokenSelector
          tokens={tokens}
          selectedToken={selectedToken}
          onSelect={onTokenSelect}
          excludeToken={excludeToken}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
