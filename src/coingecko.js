import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(readFileSync(join(__dirname, 'crypto.json'), 'utf8'))

const resp = await fetch(
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=chf&per_page=250',
)
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const data = await resp.json()

// Price is in CHF per 1 coin. Rate = 1 / price (how many coins per 1 CHF)
const rates = {}
for (const item of data) {
  const s = item.symbol.toUpperCase()
  if (!(s in config)) continue
  if (s in rates) continue
  const price = +item.current_price
  if (!price) continue
  rates[s] = 1 / price
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

const outPath = join(dir, 'coingecko.json')
const output = {
  provider: 'coingecko',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
