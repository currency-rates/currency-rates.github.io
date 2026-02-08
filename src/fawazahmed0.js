import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fiatConfig = JSON.parse(
  readFileSync(join(__dirname, 'currencies.json'), 'utf8'),
)
const cryptoConfig = JSON.parse(
  readFileSync(join(__dirname, 'crypto.json'), 'utf8'),
)
const config = { ...fiatConfig, ...cryptoConfig }

const resp = await fetch(
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/chf.json',
)
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const data = await resp.json()

// Rates are CHF-based: 1 CHF = X units of currency
const rates = {}
for (const [symbol, value] of Object.entries(data.chf)) {
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

const outPath = join(dir, 'fawazahmed0.json')
const output = {
  provider: 'fawazahmed0',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
