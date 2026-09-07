import { describe, expect, it } from 'vitest'
import { allocateToPool, computeDayPool } from '../day-pool'
import { computeDayProgress, type FoodIndex } from '../day-progress'
import { localDate } from '../../model/local-date'
import type { LogEntry } from '../../model/log-entry'
import type { PlanItem } from '../../model/plan-item'
import { quantity } from '../../model/quantity'
import { chicken, oliveOil, potato, rice } from '@/test/factories'

const DATE = localDate('2026-09-06')
const foods: FoodIndex = new Map([rice, potato, chicken, oliveOil].map((f) => [f.id, f]))

const line = (id: string, slot: PlanItem['slot'], foodId: string, amount: number, unit: 'g' | 'tsp' = 'g'): PlanItem => ({
  id,
  slot,
  order: 0,
  foodId,
  quantity: quantity(amount, unit),
  planAlternativeIds: [],
})

const log = (id: string, slot: LogEntry['slot'], foodId: string, amount: number, planItemId: string | null): LogEntry => ({
  id,
  date: DATE,
  slot,
  foodId,
  quantity: quantity(amount, 'g'),
  planItemId,
  loggedAt: '2026-09-06T12:00:00.000Z',
})

const poolOf = (planItems: readonly PlanItem[], logs: readonly LogEntry[] = []) =>
  computeDayPool(computeDayProgress({ date: DATE, planItems, logs, foods }))

describe('computeDayPool', () => {
  it('merges the same food across meals into one total for the day', () => {
    const pool = poolOf([line('breakfast-rice', 'breakfast', 'rice', 60), line('lunch-rice', 'lunch', 'rice', 150)])

    expect(pool.foods).toHaveLength(1)
    expect(pool.foods[0]?.planned).toEqual(quantity(210, 'g'))
    expect(pool.foods[0]?.slots).toEqual(['breakfast', 'lunch'])
  })

  it('lists the meals in the order they occur in a day, not in plan order', () => {
    const pool = poolOf([line('dinner-rice', 'dinner', 'rice', 60), line('breakfast-rice', 'breakfast', 'rice', 60)])

    expect(pool.foods[0]?.slots).toEqual(['breakfast', 'dinner'])
  })

  it('keeps foods measured in different units as separate pools', () => {
    const pool = poolOf([
      line('lunch-oil', 'lunch', 'olive-oil', 5),
      line('dinner-oil', 'dinner', 'olive-oil', 2, 'tsp'),
    ])

    expect(pool.foods).toHaveLength(2)
    expect(pool.foods.map((food) => food.planned.unit).sort()).toEqual(['g', 'tsp'])
  })

  it('adds up what was eaten across the merged lines', () => {
    const pool = poolOf(
      [line('breakfast-rice', 'breakfast', 'rice', 60), line('lunch-rice', 'lunch', 'rice', 150)],
      [log('a', 'breakfast', 'rice', 60, 'breakfast-rice'), log('b', 'lunch', 'rice', 50, 'lunch-rice')],
    )

    expect(pool.foods[0]?.consumed).toEqual(quantity(110, 'g'))
    expect(pool.foods[0]?.remaining).toEqual(quantity(100, 'g'))
    expect(pool.foods[0]?.completion).toBeCloseTo(110 / 210)
  })

  it('counts a swapped food against the pool it replaces', () => {
    // 100 g of planned rice is 100 * 260 / 60 = 433.33 g of potato.
    const pool = poolOf([line('lunch-rice', 'lunch', 'rice', 100)], [log('a', 'lunch', 'potato', 260, 'lunch-rice')])

    expect(pool.foods[0]?.consumed.amount).toBeCloseTo(60)
  })

  it('shows an overshoot as a negative remainder rather than clamping it', () => {
    const pool = poolOf([line('lunch-rice', 'lunch', 'rice', 100)], [log('a', 'lunch', 'rice', 150, 'lunch-rice')])

    expect(pool.foods[0]?.remaining).toEqual(quantity(-50, 'g'))
  })

  it('collects everything eaten outside the plan', () => {
    const pool = poolOf([line('lunch-rice', 'lunch', 'rice', 100)], [log('a', 'dinner', 'potato', 100, null)])

    expect(pool.extras.map((entry) => entry.id)).toEqual(['a'])
  })

  it('surfaces entries that cannot count towards the pool', () => {
    const pool = poolOf([line('lunch-rice', 'lunch', 'rice', 100)], [log('a', 'lunch', 'chicken', 100, 'lunch-rice')])

    expect(pool.foods[0]?.unconvertible).toHaveLength(1)
    expect(pool.foods[0]?.consumed).toEqual(quantity(0, 'g'))
  })
})

describe('day pool groups', () => {
  it('groups foods by the exchange table they belong to', () => {
    const pool = poolOf([
      line('lunch-rice', 'lunch', 'rice', 150),
      line('lunch-chicken', 'lunch', 'chicken', 150),
      line('dinner-potato', 'dinner', 'potato', 200),
    ])

    expect(pool.groups.map((group) => [group.category, group.foods.length])).toEqual([
      ['protein', 1],
      ['carb', 2],
    ])
  })

  it('orders the groups the way the coach tables are printed', () => {
    const pool = poolOf([
      line('lunch-oil', 'lunch', 'olive-oil', 2, 'tsp'),
      line('lunch-rice', 'lunch', 'rice', 150),
      line('lunch-chicken', 'lunch', 'chicken', 150),
    ])

    expect(pool.groups.map((group) => group.category)).toEqual(['protein', 'carb', 'fat'])
  })

  it('leaves out a table with nothing planned from it', () => {
    const pool = poolOf([line('lunch-rice', 'lunch', 'rice', 150)])

    expect(pool.groups.map((group) => group.category)).toEqual(['carb'])
  })

  it('puts what is still owed before what is finished', () => {
    const pool = poolOf(
      [line('breakfast-rice', 'breakfast', 'rice', 60), line('dinner-potato', 'dinner', 'potato', 200)],
      [log('a', 'breakfast', 'rice', 60, 'breakfast-rice')],
    )

    expect(pool.groups[0]?.foods.map((food) => food.foodId)).toEqual(['potato', 'rice'])
    expect(pool.groups[0]?.finishedCount).toBe(1)
    expect(pool.groups[0]?.completion).toBeCloseTo(0.5)
  })
})

describe('allocateToPool', () => {
  const twoLines = poolOf([line('breakfast-rice', 'breakfast', 'rice', 60), line('lunch-rice', 'lunch', 'rice', 150)])
  const pool = twoLines.foods[0]

  it('fills the earliest unmet line first', () => {
    expect(allocateToPool(pool!, quantity(40, 'g'))).toEqual([
      { planItemId: 'breakfast-rice', slot: 'breakfast', quantity: quantity(40, 'g') },
    ])
  })

  it('spills the excess onto the next line once the first is met', () => {
    expect(allocateToPool(pool!, quantity(100, 'g'))).toEqual([
      { planItemId: 'breakfast-rice', slot: 'breakfast', quantity: quantity(60, 'g') },
      { planItemId: 'lunch-rice', slot: 'lunch', quantity: quantity(40, 'g') },
    ])
  })

  it('puts anything beyond the whole day on the last line so the overshoot is visible', () => {
    expect(allocateToPool(pool!, quantity(250, 'g'))).toEqual([
      { planItemId: 'breakfast-rice', slot: 'breakfast', quantity: quantity(60, 'g') },
      { planItemId: 'lunch-rice', slot: 'lunch', quantity: quantity(190, 'g') },
    ])
  })

  it('records against the last line when the day is already complete', () => {
    const full = poolOf(
      [line('breakfast-rice', 'breakfast', 'rice', 60), line('lunch-rice', 'lunch', 'rice', 150)],
      [log('a', 'breakfast', 'rice', 60, 'breakfast-rice'), log('b', 'lunch', 'rice', 150, 'lunch-rice')],
    ).foods[0]

    expect(allocateToPool(full!, quantity(30, 'g'))).toEqual([
      { planItemId: 'lunch-rice', slot: 'lunch', quantity: quantity(30, 'g') },
    ])
  })

  it('ignores a non positive amount', () => {
    expect(allocateToPool(pool!, quantity(0, 'g'))).toEqual([])
  })

  it('refuses an amount in a unit the pool is not measured in', () => {
    expect(() => allocateToPool(pool!, quantity(2, 'tsp'))).toThrow(/tsp/)
  })
})
