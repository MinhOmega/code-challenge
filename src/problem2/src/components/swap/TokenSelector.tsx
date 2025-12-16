import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Token } from '@/types';

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  excludeToken?: Token | null;
  disabled?: boolean;
  placeholder?: string;
}

function TokenIcon({ token, size = 24 }: { token: Token; size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-muted text-xs font-medium"
        style={{ width: size, height: size }}
      >
        {token.currency.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={token.iconUrl}
      alt={token.currency}
      width={size}
      height={size}
      className="rounded-full"
      onError={() => setImgError(true)}
    />
  );
}

export function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  excludeToken,
  disabled = false,
  placeholder = 'Select token',
}: TokenSelectorProps) {
  const filteredTokens = excludeToken
    ? tokens.filter((t) => t.currency !== excludeToken.currency)
    : tokens;

  const handleValueChange = (value: string) => {
    const token = tokens.find((t) => t.currency === value);
    if (token) {
      onSelect(token);
    }
  };

  return (
    <Select
      value={selectedToken?.currency || ''}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[140px] bg-background">
        <SelectValue placeholder={placeholder}>
          {selectedToken && (
            <div className="flex items-center gap-2">
              <TokenIcon token={selectedToken} size={20} />
              <span>{selectedToken.currency}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {filteredTokens.map((token) => (
          <SelectItem key={token.currency} value={token.currency}>
            <div className="flex items-center gap-2">
              <TokenIcon token={token} size={20} />
              <span>{token.currency}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                ${token.price.toFixed(token.price < 1 ? 6 : 2)}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { TokenIcon };
