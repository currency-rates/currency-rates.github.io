# Currency Rates

Daily exchange rates for 170+ fiat currencies and cryptocurrencies, published as static JSON on GitHub Pages.

Rates are aggregated from multiple providers and computed as a **median** for reliability. Base currency is **CHF** (
Swiss franc).

**Website:** https://currency-rates.github.io/

## API

No authentication, no rate limits, no API keys. Just static JSON served via GitHub Pages.

### Get latest rates

```sh
curl https://currency-rates.github.io/rates.json
```

Returns an object mapping currency codes to CHF-based exchange rates:

```json
{
  "EUR": 1.0908,
  "USD": 1.2892,
  "GBP": 0.9468,
  "BTC": 0.00001836,
  "ETH": 0.0006152
}
```

### Get rates for a specific date

```sh
curl https://currency-rates.github.io/YYYY-MM-DD/rates.json
```

### Get metadata

```sh
curl https://currency-rates.github.io/meta.json
```

Returns the publish date, count, and currency names.

### Examples with [fx](https://fx.wtf)

Get a single rate:

```sh
curl -s https://currency-rates.github.io/rates.json | fx .USD
```

Convert 100 USD to EUR:

```sh
curl -s https://currency-rates.github.io/rates.json | fx 'x => 100 / x.USD * x.EUR'
```

Interactive exploration:

```sh
curl -s https://currency-rates.github.io/rates.json | fx
```

## Data sources

Rates are fetched daily from multiple providers and the median is used:

| Provider          | Type   | Currencies     |
| ----------------- | ------ | -------------- |
| Aviasales         | Fiat   | 170+           |
| OpenExchangeRates | Fiat   | 170+           |
| Coinbase          | Crypto | BTC, ETH, DOGE |
| CoinGecko         | Crypto | BTC, ETH, DOGE |
| CoinRanking       | Crypto | BTC, ETH, DOGE |

A rate is flagged if it deviates more than 10% from the median across providers.

## Schedule

- Provider rates are fetched daily at ~08:00-08:20 UTC
- Median rates are published at ~23:00 UTC
- The website and JSON endpoints are updated automatically via GitHub Pages

## Development

```sh
npm ci
npm test
npm run lint
```
