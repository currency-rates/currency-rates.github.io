import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHmac } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(readFileSync(join(__dirname, 'crypto.json'), 'utf8'))

const apiKey = process.env.COINBASE_API_KEY
const apiSecret = process.env.COINBASE_API_SECRET
if (!apiKey || !apiSecret) {
  const missing = []
  if (!apiKey) missing.push('COINBASE_API_KEY')
  if (!apiSecret) missing.push('COINBASE_API_SECRET')
  console.error('Missing env var(s): ' + missing.join(', '))
  process.exit(1)
}

const timestamp = Math.floor(Date.now() / 1000).toString()
const requestPath = '/v2/exchange-rates?currency=CHF'
const hmac = createHmac('sha256', apiSecret)
hmac.update(timestamp + 'GET' + requestPath)
const sign = hmac.digest('hex')

const resp = await fetch('https://api.coinbase.com' + requestPath, {
  headers: {
    'Content-Type': 'application/json',
    'CB-ACCESS-KEY': apiKey,
    'CB-ACCESS-SIGN': sign,
    'CB-ACCESS-TIMESTAMP': timestamp,
    'CB-VERSION': '2021-06-03',
  },
})
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const data = await resp.json()

// Rates come back as CHF-based: how many units of X per 1 CHF
const rates = {}
for (const [symbol, value] of Object.entries(data.data.rates)) {
  const s = symbol.toUpperCase()
  if (!(s in config)) continue
  rates[s] = +value
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

const outPath = join(dir, 'coinbase.json')
const output = {
  provider: 'coinbase',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
