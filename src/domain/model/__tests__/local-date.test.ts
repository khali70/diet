import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, isLocalDate, localDate, toLocalDate } from '../local-date'

describe('local date', () => {
  it('accepts a well formed calendar day', () => {
    expect(isLocalDate('2026-09-06')).toBe(true)
  })

  it.each(['06-09-2026', '2026-9-6', '2026-09-06T00:00:00Z', ''])('rejects %s', (value) => {
    expect(isLocalDate(value)).toBe(false)
    expect(() => localDate(value)).toThrow()
  })

  it('uses the local calendar day, not the UTC day', () => {
    // Late evening local time can already be the next day in UTC. The meal
    // still belongs to the local day it was eaten on.
    expect(toLocalDate(new Date(2026, 8, 6, 23, 59))).toBe('2026-09-06')
    expect(toLocalDate(new Date(2026, 8, 7, 0, 1))).toBe('2026-09-07')
  })

  it('pads single digit months and days', () => {
    expect(toLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('adds and subtracts days across month and year boundaries', () => {
    expect(addDays(localDate('2026-09-30'), 1)).toBe('2026-10-01')
    expect(addDays(localDate('2026-01-01'), -1)).toBe('2025-12-31')
    expect(addDays(localDate('2026-09-06'), 14)).toBe('2026-09-20')
  })

  it('counts whole days between two dates', () => {
    expect(daysBetween(localDate('2026-09-06'), localDate('2026-09-06'))).toBe(0)
    expect(daysBetween(localDate('2026-09-06'), localDate('2026-09-20'))).toBe(14)
    expect(daysBetween(localDate('2026-09-20'), localDate('2026-09-06'))).toBe(-14)
  })

  it('is unaffected by daylight saving shifts', () => {
    expect(daysBetween(localDate('2026-03-01'), localDate('2026-11-01'))).toBe(245)
  })
})
