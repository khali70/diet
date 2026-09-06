import { describe, expect, it } from 'vitest'
import { convertExchange, toExchangeUnits } from '../exchange-calculator'
import { quantity } from '../../model/quantity'
import { almond, chicken, ketchup, oliveOil, potato, rice, walnut, makeFood } from '@/test/factories'

const expectOk = <T, E>(r: { ok: true; value: T } | { ok: false; error: E }): T => {
  if (!r.ok) throw new Error(`expected ok, got error ${JSON.stringify(r.error)}`)
  return r.value
}

const expectErr = <T, E>(r: { ok: true; value: T } | { ok: false; error: E }): E => {
  if (r.ok) throw new Error(`expected error, got value ${JSON.stringify(r.value)}`)
  return r.error
}

describe('convertExchange', () => {
  it('reproduces the worked example printed in the exchange list', () => {
    // 60 g rice and 260 g potato are one exchange each, so 100 g of planned
    // rice becomes 100 * 260 / 60 g of potato. The PDF prints this rounded
    // to 435; the domain keeps the exact value.
    const result = expectOk(convertExchange(rice, quantity(100, 'g'), potato))

    expect(result.quantity.amount).toBeCloseTo((100 * 260) / 60, 10)
    expect(result.quantity.unit).toBe('g')
    expect(Math.round(result.quantity.amount / 5) * 5).toBe(435)
  })

  it('converts a reference portion into exactly one target reference portion', () => {
    const result = expectOk(convertExchange(rice, quantity(60, 'g'), potato))

    expect(result.quantity.amount).toBeCloseTo(260, 10)
  })

  it('returns the input unchanged when swapping a food for itself', () => {
    const result = expectOk(convertExchange(rice, quantity(137, 'g'), rice))

    expect(result.quantity.amount).toBeCloseTo(137, 10)
  })

  it('round trips back to the original amount', () => {
    const there = expectOk(convertExchange(rice, quantity(100, 'g'), potato))
    const back = expectOk(convertExchange(potato, there.quantity, rice))

    expect(back.quantity.amount).toBeCloseTo(100, 10)
  })

  it('scales linearly with the planned amount', () => {
    const single = expectOk(convertExchange(rice, quantity(60, 'g'), potato))
    const double = expectOk(convertExchange(rice, quantity(120, 'g'), potato))

    expect(double.quantity.amount).toBeCloseTo(single.quantity.amount * 2, 10)
  })

  it('rejects a swap across categories', () => {
    expect(expectErr(convertExchange(rice, quantity(100, 'g'), chicken)).code).toBe('CATEGORY_MISMATCH')
  })

  it('rejects a food that has no exchange table', () => {
    expect(expectErr(convertExchange(ketchup, quantity(20, 'g'), rice)).code).toBe('NOT_EXCHANGEABLE')
    expect(expectErr(convertExchange(rice, quantity(60, 'g'), ketchup)).code).toBe('NOT_EXCHANGEABLE')
  })

  it('rejects a planned amount whose unit does not match the source table', () => {
    // Olive oil is listed in small spoons, so a gram amount cannot be used
    // without an explicit gram equivalence.
    expect(expectErr(convertExchange(oliveOil, quantity(15, 'g'), almond)).code).toBe('UNIT_MISMATCH')
  })

  it('rejects a non positive planned amount', () => {
    expect(expectErr(convertExchange(rice, quantity(0, 'g'), potato)).code).toBe('NON_POSITIVE_QUANTITY')
    expect(expectErr(convertExchange(rice, quantity(-10, 'g'), potato)).code).toBe('NON_POSITIVE_QUANTITY')
  })

  it('rejects a source whose reference portion is not positive', () => {
    const broken = makeFood('broken', 'carb', 0)

    expect(expectErr(convertExchange(broken, quantity(60, 'g'), potato)).code).toBe('MISSING_REFERENCE')
  })

  it('carries the target unit, not the source unit', () => {
    const result = expectOk(convertExchange(almond, quantity(20, 'g'), oliveOil))

    expect(result.quantity.unit).toBe('tsp')
    expect(result.quantity.amount).toBeCloseTo(3, 10)
  })

  it('flags a fat swap across sub groups as discouraged but still allows it', () => {
    const result = expectOk(convertExchange(almond, quantity(20, 'g'), walnut))

    expect(result.discouraged).toBe(true)
    expect(result.quantity.amount).toBeCloseTo(20, 10)
  })

  it('does not flag a fat swap inside the same sub group', () => {
    expect(expectOk(convertExchange(almond, quantity(20, 'g'), oliveOil)).discouraged).toBe(false)
  })

  it('never flags a non fat swap as discouraged', () => {
    expect(expectOk(convertExchange(rice, quantity(60, 'g'), potato)).discouraged).toBe(false)
  })
})

describe('toExchangeUnits', () => {
  it('expresses an amount as a fraction of the reference portion', () => {
    expect(expectOk(toExchangeUnits(rice, quantity(100, 'g')))).toBeCloseTo(100 / 60, 10)
    expect(expectOk(toExchangeUnits(rice, quantity(60, 'g')))).toBeCloseTo(1, 10)
  })

  it('rejects a food with no exchange table', () => {
    expect(expectErr(toExchangeUnits(ketchup, quantity(20, 'g'))).code).toBe('NOT_EXCHANGEABLE')
  })

  it('rejects a mismatched unit', () => {
    expect(expectErr(toExchangeUnits(oliveOil, quantity(15, 'g'))).code).toBe('UNIT_MISMATCH')
  })

  it('rejects a non positive reference portion', () => {
    expect(expectErr(toExchangeUnits(makeFood('broken', 'carb', 0), quantity(10, 'g'))).code).toBe('MISSING_REFERENCE')
  })
})
