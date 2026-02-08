import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(
  readFileSync(join(__dirname, 'currencies.json'), 'utf8'),
)

const resp = await fetch(
  'https://api.nbp.pl/api/exchangerates/tables/a/?format=json',
)
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const data = await resp.json()

// NBP returns PLN per 1 unit of each currency (mid rate).
// Build a lookup of PLN rates, then convert to CHF base.
// We need: how many units of X per 1 CHF = plnPerChf / plnPerX
const plnRates = {}
for (const row of data[0].rates) {
  plnRates[row.code.toUpperCase()] = +row.mid
}

const plnPerChf = plnRates['CHF']
if (!plnPerChf) throw new Error('CHF rate not found in NBP response')

const rates = {}
for (const [symbol, plnPerUnit] of Object.entries(plnRates)) {
  if (!(symbol in config)) continue
  rates[symbol] = plnPerChf / plnPerUnit
}

// PLN itself: 1 CHF = plnPerChf PLN
if ('PLN' in config) {
  rates['PLN'] = plnPerChf
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

const outPath = join(dir, 'nbp.json')
const output = {
  provider: 'nbp',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
