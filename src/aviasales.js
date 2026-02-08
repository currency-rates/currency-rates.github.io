import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(
  readFileSync(join(__dirname, 'currencies.json'), 'utf8'),
)

const resp = await fetch('https://www.aviasales.com/currency.json')
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const data = await resp.json()

// API returns RUB per 1 unit of each currency. Convert to CHF base.
// chf_rate[X] = rub_per_CHF / rub_per_X
const rubPerChf = data['chf']
if (!rubPerChf) throw new Error('CHF rate not found in response')

const rates = {}
for (const [symbol, rubRate] of Object.entries(data)) {
  const s = symbol.toUpperCase()
  if (!(s in config)) continue
  rates[s] = rubPerChf / rubRate
}

const sorted = Object.keys(rates)
  .sort()
  .reduce((obj, k) => {
    obj[k] = rates[k]
    return obj
  }, {})

const now = new Date()
const date = now.toISOString().slice(0, 10)
const dir = join(__dirname, '..', 'output', ...date.split('-'))
mkdirSync(dir, { recursive: true })

const outPath = join(dir, 'aviasales.json')
const output = {
  provider: 'aviasales',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
