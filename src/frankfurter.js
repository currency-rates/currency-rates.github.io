import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(
  readFileSync(join(__dirname, 'currencies.json'), 'utf8'),
)

const resp = await fetch('https://api.frankfurter.dev/v1/latest?base=CHF')
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const data = await resp.json()

// Rates are already CHF-based when using ?base=CHF
const rates = {}
for (const [symbol, value] of Object.entries(data.rates)) {
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
const dir = join(__dirname, '..', 'output', ...date.split('-'))
mkdirSync(dir, { recursive: true })

const outPath = join(dir, 'frankfurter.json')
const output = {
  provider: 'frankfurter',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
