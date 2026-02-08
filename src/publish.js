import { readFileSync, mkdirSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 !== 0) return sorted[mid]
  return (sorted[mid - 1] + sorted[mid]) / 2
}

export function collectRates(providerFiles) {
  const ratesMap = {}
  for (const { provider, rates } of providerFiles) {
    for (const [symbol, value] of Object.entries(rates)) {
      if (!ratesMap[symbol]) ratesMap[symbol] = []
      ratesMap[symbol].push({ provider, value })
    }
  }
  return ratesMap
}

export function computeMedianRates(ratesMap) {
  const result = {}
  for (const [symbol, entries] of Object.entries(ratesMap)) {
    result[symbol] = median(entries.map((e) => e.value))
  }
  return result
}

export function checkDeviations(ratesMap, medianRates) {
  const errors = []
  for (const [symbol, entries] of Object.entries(ratesMap)) {
    const med = medianRates[symbol]
    for (const { provider, value } of entries) {
      const deviation = Math.abs(value - med) / med
      if (deviation > 0.1) {
        errors.push(
          `${provider}: ${symbol} deviates ${(deviation * 100).toFixed(1)}% from median (value=${value}, median=${med})`,
        )
      }
    }
  }
  return errors
}

export function checkCompleteness(expectedSymbols, medianRates) {
  const errors = []
  for (const symbol of expectedSymbols) {
    if (!(symbol in medianRates)) {
      errors.push(`Missing rate for ${symbol}`)
    }
  }
  return errors
}

function main() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)

  const currencies = JSON.parse(
    readFileSync(join(__dirname, 'currencies.json'), 'utf8'),
  )
  const crypto = JSON.parse(
    readFileSync(join(__dirname, 'crypto.json'), 'utf8'),
  )
  const expectedSymbols = [
    ...Object.keys(currencies),
    ...Object.keys(crypto),
  ].sort()

  const outputDir = join(__dirname, '..', 'output', date)
  const files = readdirSync(outputDir).filter((f) => f.endsWith('.json'))

  const providerFiles = []
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(outputDir, file), 'utf8'))
    if (!data.rates || Object.keys(data.rates).length === 0) continue
    providerFiles.push({ provider: data.provider, rates: data.rates })
  }

  const ratesMap = collectRates(providerFiles)
  const medianRates = computeMedianRates(ratesMap)

  const deviationErrors = checkDeviations(ratesMap, medianRates)
  for (const err of deviationErrors) {
    console.error(err)
  }

  const completenessErrors = checkCompleteness(expectedSymbols, medianRates)
  for (const err of completenessErrors) {
    console.error(err)
  }

  const sorted = Object.keys(medianRates)
    .sort()
    .reduce((obj, k) => {
      obj[k] = medianRates[k]
      return obj
    }, {})

  const ratesDir = join(__dirname, '..', 'public', date)
  mkdirSync(ratesDir, { recursive: true })
  writeFileSync(join(ratesDir, 'rates.json'), JSON.stringify(sorted, null, 2))

  const latestDir = join(__dirname, '..', 'public')
  writeFileSync(join(latestDir, 'rates.json'), JSON.stringify(sorted, null, 2))
  const names = {}
  for (const [code, { name }] of Object.entries(currencies)) {
    names[code] = name
  }
  for (const [code, { name }] of Object.entries(crypto)) {
    names[code] = name
  }
  const providers = {}
  for (const [symbol, entries] of Object.entries(ratesMap)) {
    providers[symbol] = entries.map((e) => e.provider).sort()
  }
  writeFileSync(
    join(latestDir, 'meta.json'),
    JSON.stringify({
      date,
      count: Object.keys(sorted).length,
      names,
      providers,
    }),
  )

  console.log(`Wrote ${Object.keys(sorted).length} rates for ${date}`)
}

const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (isMainModule) {
  main()
}
