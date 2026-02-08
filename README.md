# Currency Rates

Daily exchange rates for 170+ fiat currencies and crypto, published as static JSON.

No auth. No API keys. No rate limits. Just `curl`.

Base currency: **CHF**

Mirrors:

- https://currency-rates.github.io
- https://currency-rates.pages.dev

## Usage

```sh
curl https://currency-rates.github.io/rates.json
```

```json
{
  "EUR": 1.0908,
  "USD": 1.2892,
  "GBP": 0.9468,
  "BTC": 0.00001836,
  "ETH": 0.0006152
}
```

Historical rates:

```sh
curl https://currency-rates.github.io/2026/02/08/rates.json
```

With [fx](https://fx.wtf):

```sh
curl -s https://currency-rates.github.io/rates.json | fx .USD
curl -s https://currency-rates.github.io/rates.json | fx 'x => 100 / x.USD * x.EUR'
```

## Data Sources

Median across 11 providers, updated every 4 hours:

| Provider           | Type   | Status                                                                                                                                                                                                                                   |
| ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aviasales          | Fiat   | [![Aviasales](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/aviasales.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/aviasales.yml)                         |
| OpenExchangeRates  | Fiat   | [![OpenExchangeRates](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/openexchangerates.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/openexchangerates.yml) |
| Frankfurter (ECB)  | Fiat   | [![Frankfurter](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/frankfurter.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/frankfurter.yml)                   |
| ExchangeRate-API   | Fiat   | [![ExchangeRate-API](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/exchangerate.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/exchangerate.yml)            |
| FloatRates         | Fiat   | [![FloatRates](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/floatrates.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/floatrates.yml)                      |
| NBP (Poland)       | Fiat   | [![NBP](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/nbp.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/nbp.yml)                                           |
| CNB (Czechia)      | Fiat   | [![CNB](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/cnb.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/cnb.yml)                                           |
| BAZG (Switzerland) | Fiat   | [![BAZG](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/bazg.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/bazg.yml)                                        |
| Coinbase           | Crypto | [![Coinbase](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/coinbase.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/coinbase.yml)                            |
| CoinGecko          | Crypto | [![CoinGecko](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/coingecko.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/coingecko.yml)                         |
| CoinRanking        | Crypto | [![CoinRanking](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/coinranking.yml/badge.svg)](https://github.com/currency-rates/currency-rates.github.io/actions/workflows/coinranking.yml)                   |

Rates deviating >10% from median are flagged.

## Used by

- [numbr.dev](https://numbr.dev) — a smart calculator combined with a notepad

## Development

```sh
npm ci
npm test
npm run lint
```
