import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(
  readFileSync(join(__dirname, 'currencies.json'), 'utf8'),
)

const appId = process.env.OPENEXCHANGERATES_APP_ID
if (!appId) {
  console.error('Missing env var: OPENEXCHANGERATES_APP_ID')
  process.exit(1)
}

const resp = await fetch(
  `https://openexchangerates.org/api/latest.json?app_id=${appId}`,
)
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const data = await resp.json()

// API returns USD-based rates. Convert to CHF base.
const usdToChf = data.rates['CHF']
if (!usdToChf) throw new Error('CHF rate not found in response')

const rates = {}
for (const [symbol, usdRate] of Object.entries(data.rates)) {
  if (!(symbol in config)) continue
  rates[symbol] = usdRate / usdToChf
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

const outPath = join(dir, 'openexchangerates.json')
const output = {
  provider: 'openexchangerates',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
