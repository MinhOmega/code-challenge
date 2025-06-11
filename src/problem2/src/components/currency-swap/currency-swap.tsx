import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Container,
  MenuItem,
  Select,
  TextField,
  Typography,
  Stack,
  Divider,
  useTheme,
} from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'

type PriceEntry = {
  currency: string
  date: string
  price: number
}

const TOKEN_PRICE_URL = 'https://interview.switcheo.com/prices.json'
const ICON_BASE =
  'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens'

export const CurrencySwap: FC = () => {
  const theme = useTheme()
  const [prices, setPrices] = useState<PriceEntry[]>([])
  const [fromToken, setFromToken] = useState<string>('USDC')
  const [toToken, setToToken] = useState<string>('ATOM')
  const [fromAmt, setFromAmt] = useState<number>(1)
  const [toAmt, setToAmt] = useState<number>(0)

  useEffect(() => {
    fetch(TOKEN_PRICE_URL)
      .then((res) => res.json())
      .then((data: PriceEntry[]) => {
        setPrices(data)
      })
  }, [])

  const fromPrice = useMemo(
    () => prices.find((i) => i.currency === fromToken)?.price,
    [fromToken, prices]
  )
  const toPrice = useMemo(
    () => prices.find((i) => i.currency === toToken)?.price,
    [toToken, prices]
  )

  const convertForIcon = useCallback((currency: string) => {
    switch (currency) {
      case 'STEVMOS':
        return 'stEVMOS'
      case 'RATOM':
        return 'rATOM'
      case 'STOSMO':
        return 'stOSMO'
      case 'STATOM':
        return 'stATOM'
      case 'STLUNA':
        return 'stLUNA'
      default:
        return currency
    }
  }, [])

  useEffect(() => {
    if (!!fromPrice && !!toPrice) {
      setToAmt((fromPrice * fromAmt) / toPrice)
    }
  }, [fromAmt, fromToken, toToken, setToAmt, fromPrice, toPrice])

  const handleSwapToken = useCallback(() => {
    const newFromToken = toToken
    const newToToken = fromToken
    setFromToken(newFromToken)
    setToToken(newToToken)
  }, [toToken, fromToken, setFromToken, setToToken])

  return (
    <Container maxWidth="md" sx={{ minWidth: 500 }}>
      <Stack spacing={4} p={4} boxShadow={3} borderRadius={4} bgcolor="#fff">
        <Typography
          fontWeight={700}
          fontSize={28}
          color="textSecondary"
          textAlign="center"
        >
          Currency Swap
        </Typography>
        <Stack spacing={2}>
          <TextField
            type="number"
            fullWidth
            value={fromAmt.toString().replace(/^0+/, '')}
            onChange={(e) => setFromAmt(Number(e.target.value))}
            slotProps={{
              input: {
                endAdornment: (
                  <>
                    <Divider orientation="vertical" variant="middle" flexItem />
                    <Select
                      fullWidth
                      value={fromToken}
                      onChange={(e) => setFromToken(e.target.value)}
                      sx={{
                        width: '80%',
                        boxShadow: 'none',
                        '.MuiOutlinedInput-notchedOutline': { border: 0 },
                        '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                          {
                            border: 0,
                          },
                        '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                          {
                            border: 0,
                          },
                      }}
                    >
                      {prices.map((item, index) => (
                        <MenuItem key={index} value={item.currency}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <img
                              src={`${ICON_BASE}/${convertForIcon(item.currency)}.svg`}
                              alt={item.currency}
                              width={20}
                            />
                            <Typography>
                              {item.currency.toUpperCase()}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                ),
              },
            }}
          />
          <Stack alignItems="center">
            <SwapHorizIcon
              onClick={handleSwapToken}
              sx={{
                ':hover': { transform: 'rotate(-90deg)' },
                transition: 'transform 0.3s ease-in-out',
                color: theme.palette.grey['600'],
                cursor: 'pointer',
                bgcolor: theme.palette.grey['200'],
                p: 0.5,
                borderRadius: '50%',
              }}
            />
          </Stack>
          <TextField
            value={toAmt}
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <>
                    <Divider orientation="vertical" variant="middle" flexItem />
                    <Select
                      fullWidth
                      value={toToken}
                      onChange={(e) => setToToken(e.target.value)}
                      sx={{
                        width: '80%',
                        boxShadow: 'none',
                        '.MuiOutlinedInput-notchedOutline': { border: 0 },
                        '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                          {
                            border: 0,
                          },
                        '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                          {
                            border: 0,
                          },
                      }}
                    >
                      {prices.map((item, index) => (
                        <MenuItem key={index} value={item.currency}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <img
                              src={`${ICON_BASE}/${convertForIcon(item.currency)}.svg`}
                              alt={item.currency}
                              width={20}
                            />
                            <Typography>
                              {item.currency.toUpperCase()}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                ),
              },
            }}
          />
          <Typography variant="body2">
            1 {fromToken.toUpperCase()} ≈ {toAmt.toFixed(6)}{' '}
            {toToken.toUpperCase()}
          </Typography>
        </Stack>
      </Stack>
    </Container>
  )
}
