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

// Look up CHF fiat reference currency UUID
const refResp = await fetch(
  'https://api.coinranking.com/v2/reference-currencies?types[]=fiat&search=CHF',
  { headers },
)
if (!refResp.ok) throw new Error(`HTTP ${refResp.status} ${refResp.statusText}`)
const refData = await refResp.json()

const chfCurrency = refData.data.currencies.find((c) => c.symbol === 'CHF')
if (!chfCurrency) throw new Error('CHF not found in reference currencies')

// Fetch coins priced directly in CHF
const coinsResp = await fetch(
  `https://api.coinranking.com/v2/coins?limit=100&referenceCurrencyUuid=${chfCurrency.uuid}`,
  { headers },
)
if (!coinsResp.ok)
  throw new Error(`HTTP ${coinsResp.status} ${coinsResp.statusText}`)
const coinsData = await coinsResp.json()

// Price is in CHF per 1 coin. Rate = 1 / price (how many coins per 1 CHF)
const rates = {}
for (const coin of coinsData.data.coins) {
  const s = coin.symbol.toUpperCase()
  if (!(s in config)) continue
  if (s in rates) continue
  const chfPrice = +coin.price
  if (!chfPrice) continue
  rates[s] = 1 / chfPrice
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
