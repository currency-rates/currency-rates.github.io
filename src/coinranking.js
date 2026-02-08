import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(readFileSync(join(__dirname, 'crypto.json'), 'utf8'))

const apiKey = process.env.COINRANKING_API_KEY
if (!apiKey) {
  console.error('Missing env var: COINRANKING_API_KEY')
  process.exit(1)
}

const headers = { 'x-access-token': apiKey }

// Fetch coins priced in USD (default)
const coinsResp = await fetch(
  'https://api.coinranking.com/v2/coins?limit=100',
  { headers },
)
if (!coinsResp.ok)
  throw new Error(`HTTP ${coinsResp.status} ${coinsResp.statusText}`)
const coinsData = await coinsResp.json()

// Look up CHF reference currency to get USD/CHF rate
const refResp = await fetch(
  'https://api.coinranking.com/v2/reference-currencies?search=CHF',
  { headers },
)
if (!refResp.ok) throw new Error(`HTTP ${refResp.status} ${refResp.statusText}`)
const refData = await refResp.json()

const chfCurrency = refData.data.currencies.find((c) => c.symbol === 'CHF')
if (!chfCurrency) throw new Error('CHF not found in reference currencies')
// exchangeRate is CHF per 1 USD, so 1/exchangeRate = USD per 1 CHF
const usdToChf = 1 / +chfCurrency.exchangeRate
if (!usdToChf || !isFinite(usdToChf))
  throw new Error('Could not determine USD/CHF rate')

// Price is in USD per 1 coin. Convert to CHF base.
// rate = 1 / (usdPrice * usdToChf) = how many coins per 1 CHF
const rates = {}
for (const coin of coinsData.data.coins) {
  const s = coin.symbol.toUpperCase()
  if (!(s in config)) continue
  if (s in rates) continue
  const usdPrice = +coin.price
  if (!usdPrice) continue
  rates[s] = 1 / (usdPrice * usdToChf)
}

const sorted = Object.keys(rates)
  .sort()
  .reduce((obj, k) => {
    obj[k] = rates[k]
    return obj
  }, {})

const now = new Date()
const date = now.toISOString().slice(0, 10)
const dir = join(__dirname, '..', 'output', date)
mkdirSync(dir, { recursive: true })

const outPath = join(dir, 'coinranking.json')
const output = {
  provider: 'coinranking',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
