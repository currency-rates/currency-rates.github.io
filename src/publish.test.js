import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  median,
  collectRates,
  computeMedianRates,
  checkDeviations,
  checkCompleteness,
} from './publish.js'

describe('median', () => {
  it('returns the middle value for odd count', () => {
    expect(median([3, 1, 2])).toBe(2)
  })

  it('returns average of two middle values for even count', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('returns the value for single element', () => {
    expect(median([42])).toBe(42)
  })

  it('returns average for two values', () => {
    expect(median([10, 20])).toBe(15)
  })
})

describe('collectRates', () => {
  it('collects rates from multiple providers with overlapping symbols', () => {
    const result = collectRates([
      { provider: 'a', rates: { USD: 1.1, EUR: 0.9 } },
      { provider: 'b', rates: { USD: 1.2, GBP: 0.8 } },
    ])
    expect(result).toEqual({
      USD: [
        { provider: 'a', value: 1.1 },
        { provider: 'b', value: 1.2 },
      ],
      EUR: [{ provider: 'a', value: 0.9 }],
      GBP: [{ provider: 'b', value: 0.8 }],
    })
  })

  it('handles empty providers', () => {
    const result = collectRates([
      { provider: 'a', rates: {} },
      { provider: 'b', rates: { USD: 1.0 } },
    ])
    expect(result).toEqual({
      USD: [{ provider: 'b', value: 1.0 }],
    })
  })
})

describe('computeMedianRates', () => {
  it('computes median for each symbol', () => {
    const ratesMap = {
      USD: [
        { provider: 'a', value: 1.0 },
        { provider: 'b', value: 1.2 },
        { provider: 'c', value: 1.1 },
      ],
      EUR: [
        { provider: 'a', value: 0.9 },
        { provider: 'b', value: 0.95 },
      ],
    }
    const result = computeMedianRates(ratesMap)
    expect(result.USD).toBe(1.1)
    expect(result.EUR).toBe(0.925)
  })

  it('handles single provider per symbol', () => {
    const ratesMap = {
      BTC: [{ provider: 'a', value: 0.00002 }],
    }
    const result = computeMedianRates(ratesMap)
    expect(result.BTC).toBe(0.00002)
  })
})

describe('checkDeviations', () => {
  it('returns no errors when all values are close', () => {
    const ratesMap = {
      USD: [
        { provider: 'a', value: 1.0 },
        { provider: 'b', value: 1.05 },
      ],
    }
    const medianRates = { USD: 1.025 }
    expect(checkDeviations(ratesMap, medianRates)).toEqual([])
  })

  it('returns no error at exactly 10%', () => {
    const ratesMap = {
      USD: [{ provider: 'a', value: 11 }],
    }
    const medianRates = { USD: 10 }
    expect(checkDeviations(ratesMap, medianRates)).toEqual([])
  })

  it('returns error for >10% deviation', () => {
    const ratesMap = {
      USD: [
        { provider: 'a', value: 1.0 },
        { provider: 'b', value: 1.5 },
      ],
    }
    const medianRates = { USD: 1.0 }
    const errors = checkDeviations(ratesMap, medianRates)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('b')
    expect(errors[0]).toContain('USD')
    expect(errors[0]).toContain('50.0%')
  })

  it('reports multiple deviations', () => {
    const ratesMap = {
      USD: [
        { provider: 'a', value: 0.5 },
        { provider: 'b', value: 2.0 },
      ],
      EUR: [{ provider: 'c', value: 5.0 }],
    }
    const medianRates = { USD: 1.0, EUR: 1.0 }
    const errors = checkDeviations(ratesMap, medianRates)
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })
})

describe('checkCompleteness', () => {
  it('returns no errors when all symbols present', () => {
    const errors = checkCompleteness(['USD', 'EUR'], { USD: 1.0, EUR: 0.9 })
    expect(errors).toEqual([])
  })

  it('returns errors for missing symbols', () => {
    const errors = checkCompleteness(['USD', 'EUR', 'GBP'], { USD: 1.0 })
    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain('EUR')
    expect(errors[1]).toContain('GBP')
  })

  it('returns errors for all missing', () => {
    const errors = checkCompleteness(['USD', 'EUR'], {})
    expect(errors).toHaveLength(2)
  })
})

describe('integration', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = join(tmpdir(), `combine-test-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('produces correct combined output from mock provider files', () => {
    const providerA = {
      provider: 'provider_a',
      datetime: '2026-01-01T00:00:00Z',
      base: 'CHF',
      rates: { USD: 1.1, EUR: 0.9, BTC: 0.00002 },
    }
    const providerB = {
      provider: 'provider_b',
      datetime: '2026-01-01T00:00:00Z',
      base: 'CHF',
      rates: { USD: 1.2, EUR: 0.95 },
    }
    const providerC = {
      provider: 'provider_c',
      datetime: '2026-01-01T00:00:00Z',
      base: 'CHF',
      rates: { USD: 1.15, EUR: 0.92 },
    }
    const emptyProvider = {
      provider: 'empty',
      datetime: '2026-01-01T00:00:00Z',
      base: 'CHF',
      rates: {},
    }

    writeFileSync(join(tmpDir, 'a.json'), JSON.stringify(providerA))
    writeFileSync(join(tmpDir, 'b.json'), JSON.stringify(providerB))
    writeFileSync(join(tmpDir, 'c.json'), JSON.stringify(providerC))
    writeFileSync(join(tmpDir, 'empty.json'), JSON.stringify(emptyProvider))

    // Read files and filter like the script does
    const files = ['a.json', 'b.json', 'c.json', 'empty.json']
    const providerFiles = []
    for (const file of files) {
      const data = JSON.parse(readFileSync(join(tmpDir, file), 'utf8'))
      if (!data.rates || Object.keys(data.rates).length === 0) continue
      providerFiles.push({ provider: data.provider, rates: data.rates })
    }

    expect(providerFiles).toHaveLength(3)

    const ratesMap = collectRates(providerFiles)
    const medianRates = computeMedianRates(ratesMap)

    // USD: median of [1.1, 1.15, 1.2] = 1.15
    expect(medianRates.USD).toBe(1.15)
    // EUR: median of [0.9, 0.92, 0.95] = 0.92
    expect(medianRates.EUR).toBe(0.92)
    // BTC: single value
    expect(medianRates.BTC).toBe(0.00002)

    // Output is sorted alphabetically
    const sorted = Object.keys(medianRates)
      .sort()
      .reduce((obj, k) => {
        obj[k] = medianRates[k]
        return obj
      }, {})
    const keys = Object.keys(sorted)
    expect(keys).toEqual(['BTC', 'EUR', 'USD'])

    // Write and re-read to verify JSON format
    const outPath = join(tmpDir, 'rates.json')
    writeFileSync(outPath, JSON.stringify(sorted, null, 2))
    const output = JSON.parse(readFileSync(outPath, 'utf8'))
    expect(output).toEqual({ BTC: 0.00002, EUR: 0.92, USD: 1.15 })
  })
})
