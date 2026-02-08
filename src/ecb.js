import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(
  readFileSync(join(__dirname, 'currencies.json'), 'utf8'),
)

const resp = await fetch(
  'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
)
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const xml = await resp.text()

// ECB XML has <Cube currency="USD" rate="1.1794"/> entries
// Rates are units of currency per 1 EUR
const eurRates = {}
for (const m of xml.matchAll(/currency='([A-Z]+)'\s+rate='([^']+)'/g)) {
  eurRates[m[1]] = +m[2]
}

const eurPerChf = eurRates['CHF']
if (!eurPerChf) throw new Error('CHF rate not found in ECB response')

const rates = {}
for (const [symbol, eurPerUnit] of Object.entries(eurRates)) {
  if (!(symbol in config)) continue
  // units of X per 1 CHF = eurRates[X] / eurRates[CHF]
  rates[symbol] = eurPerUnit / eurPerChf
}

// EUR itself: 1 CHF = 1 / eurPerChf EUR
if ('EUR' in config) {
  rates['EUR'] = 1 / eurPerChf
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

const outPath = join(dir, 'ecb.json')
const output = {
  provider: 'ecb',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
