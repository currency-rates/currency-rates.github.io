# Currency Rates

Daily exchange rates for 170+ fiat currencies and crypto, published as static JSON.

No auth. No API keys. No rate limits. Just `curl`.

Base currency: **CHF**

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
curl https://currency-rates.github.io/2026-02-08/rates.json
```

With [fx](https://fx.wtf):

```sh
curl -s https://currency-rates.github.io/rates.json | fx .USD
curl -s https://currency-rates.github.io/rates.json | fx 'x => 100 / x.USD * x.EUR'
```

## Data Sources

Median across 11 providers, updated daily:

| Provider          | Type   | Auth |
| ----------------- | ------ | ---- |
| Aviasales         | Fiat   | -    |
| OpenExchangeRates | Fiat   | Key  |
| Frankfurter (ECB) | Fiat   | -    |
| ExchangeRate-API  | Fiat   | -    |
| FloatRates        | Fiat   | -    |
| NBP (Poland)      | Fiat   | -    |
| CNB (Czechia)     | Fiat   | -    |
| Coinbase          | Crypto | Key  |
| CoinGecko         | Crypto | -    |
| CoinRanking       | Crypto | Key  |
| fawazahmed0       | Both   | -    |

Rates deviating >10% from median are flagged.

## Development

```sh
npm ci
npm test
npm run lint
```
