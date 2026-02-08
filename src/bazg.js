import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(
  readFileSync(join(__dirname, 'currencies.json'), 'utf8'),
)

const resp = await fetch('https://www.backend-rates.bazg.admin.ch/api/xmldaily')
if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
const xml = await resp.text()

// BAZG gives CHF per <amount> units of foreign currency.
// We need: units of X per 1 CHF = amount / kurs
const rates = {}
const re =
  /<devise[^>]*>[\s\S]*?<waehrung>([\d]+)\s+(\w+)<\/waehrung>\s*<kurs>([\d.]+)<\/kurs>[\s\S]*?<\/devise>/g
let m
while ((m = re.exec(xml)) !== null) {
  const amount = +m[1]
  const code = m[2].toUpperCase()
  const kurs = +m[3]
  if (!(code in config)) continue
  rates[code] = amount / kurs
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

const outPath = join(dir, 'bazg.json')
const output = {
  provider: 'bazg',
  datetime: now.toISOString(),
  base: 'CHF',
  rates: sorted,
}
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(outPath)
