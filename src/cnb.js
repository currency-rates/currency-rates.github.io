import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(
  readFileSync(join(__dirname, 'currencies.json'), 'utf8'),
)

const resp = await fetch('https://api.cnb.cz/cnbapi/exrates/daily?lang=EN')
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const data = await resp.json()

// CNB returns CZK per "amount" units of each currency.
// Effective rate per 1 unit = czk / amount.
// We need: how many units of X per 1 CHF = czkPerChf / czkPerX
const czkRates = {}
for (const row of data.rates) {
  czkRates[row.currencyCode.toUpperCase()] = +row.rate / +row.amount
}

const czkPerChf = czkRates['CHF']
if (!czkPerChf) throw new Error('CHF rate not found in CNB response')

const rates = {}
for (const [symbol, czkPerUnit] of Object.entries(czkRates)) {
  if (!(symbol in config)) continue
  rates[symbol] = czkPerChf / czkPerUnit
}

// CZK itself: 1 CHF = czkPerChf CZK
if ('CZK' in config) {
  rates['CZK'] = czkPerChf
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

const outPath = join(dir, 'cnb.json')
const output = {
  provider: 'cnb',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
