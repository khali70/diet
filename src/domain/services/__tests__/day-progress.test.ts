import { describe, expect, it } from 'vitest'
import { computeDayProgress, type FoodIndex } from '../day-progress'
import { localDate } from '../../model/local-date'
import type { LogEntry } from '../../model/log-entry'
import type { PlanItem } from '../../model/plan-item'
import { quantity } from '../../model/quantity'
import { chicken, ketchup, potato, rice } from '@/test/factories'

const DATE = localDate('2026-09-06')

const foods: FoodIndex = new Map([rice, potato, chicken, ketchup].map((f) => [f.id, f]))

const riceLine: PlanItem = {
  id: 'lunch-rice',
  slot: 'lunch',
  order: 0,
  foodId: 'rice',
  quantity: quantity(100, 'g'),
  planAlternativeIds: [],
}

const chickenLine: PlanItem = {
  id: 'lunch-chicken',
  slot: 'lunch',
  order: 1,
  foodId: 'chicken',
  quantity: quantity(150, 'g'),
  planAlternativeIds: [],
}

const log = (over: Partial<LogEntry> & Pick<LogEntry, 'foodId' | 'quantity'>): LogEntry => ({
  id: `log-${Math.random()}`,
  date: DATE,
  slot: 'lunch',
  planItemId: null,
  loggedAt: '2026-09-06T13:00:00.000Z',
  ...over,
})

const lunchOf = (progress: ReturnType<typeof computeDayProgress>) => {
  const slot = progress.slots.find((s) => s.slot === 'lunch')
  if (slot === undefined) throw new Error('lunch slot missing')
  return slot
}

describe('computeDayProgress', () => {
  it('reports the full planned amount as remaining when nothing was logged', () => {
    const progress = computeDayProgress({ date: DATE, planItems: [riceLine], logs: [], foods })
    const item = lunchOf(progress).items[0]!

    expect(item.consumed.amount).toBe(0)
    expect(item.remaining.amount).toBe(100)
    expect(item.completion).toBe(0)
    expect(progress.completion).toBe(0)
  })

  it('subtracts a partial log from the planned amount', () => {
    const logs = [log({ foodId: 'rice', quantity: quantity(40, 'g'), planItemId: 'lunch-rice' })]
    const item = lunchOf(computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods })).items[0]!

    expect(item.consumed.amount).toBe(40)
    expect(item.remaining.amount).toBe(60)
    expect(item.completion).toBeCloseTo(0.4, 10)
  })

  it('sums several logs against the same line', () => {
    const logs = [
      log({ foodId: 'rice', quantity: quantity(40, 'g'), planItemId: 'lunch-rice' }),
      log({ foodId: 'rice', quantity: quantity(35, 'g'), planItemId: 'lunch-rice' }),
    ]
    const item = lunchOf(computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods })).items[0]!

    expect(item.consumed.amount).toBe(75)
    expect(item.remaining.amount).toBe(25)
  })

  it('closes a line when an equivalent substitute is logged against it', () => {
    // 100 g of planned rice equals 100 * 260 / 60 g of potato.
    const equivalent = (100 * 260) / 60
    const logs = [log({ foodId: 'potato', quantity: quantity(equivalent, 'g'), planItemId: 'lunch-rice' })]
    const item = lunchOf(computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods })).items[0]!

    expect(item.consumed.amount).toBeCloseTo(100, 8)
    expect(item.remaining.amount).toBeCloseTo(0, 8)
    expect(item.completion).toBeCloseTo(1, 8)
  })

  it('counts half a substitute portion as half the planned line', () => {
    const logs = [log({ foodId: 'potato', quantity: quantity(130, 'g'), planItemId: 'lunch-rice' })]
    const item = lunchOf(computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods })).items[0]!

    expect(item.consumed.amount).toBeCloseTo(30, 8)
  })

  it('shows an overshoot as a negative remainder rather than clamping to zero', () => {
    const logs = [log({ foodId: 'rice', quantity: quantity(160, 'g'), planItemId: 'lunch-rice' })]
    const item = lunchOf(computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods })).items[0]!

    expect(item.remaining.amount).toBe(-60)
    expect(item.completion).toBeCloseTo(1.6, 10)
  })

  it('caps an overshooting line at full completion for the day average', () => {
    const logs = [log({ foodId: 'rice', quantity: quantity(300, 'g'), planItemId: 'lunch-rice' })]
    const progress = computeDayProgress({ date: DATE, planItems: [riceLine, chickenLine], logs, foods })

    expect(progress.completion).toBeCloseTo(0.5, 10)
  })

  it('surfaces a log that cannot be converted into the planned food', () => {
    const logs = [log({ foodId: 'chicken', quantity: quantity(100, 'g'), planItemId: 'lunch-rice' })]
    const item = lunchOf(computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods })).items[0]!

    expect(item.unconvertible).toHaveLength(1)
    expect(item.consumed.amount).toBe(0)
  })

  it('keeps a log with no planned line as a slot extra', () => {
    const logs = [log({ foodId: 'ketchup-light', quantity: quantity(20, 'g') })]
    const slot = lunchOf(computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods }))

    expect(slot.extras).toHaveLength(1)
    expect(slot.items[0]!.consumed.amount).toBe(0)
  })

  it('treats a log pointing at an unknown plan line as an extra', () => {
    const logs = [log({ foodId: 'rice', quantity: quantity(50, 'g'), planItemId: 'deleted-line' })]
    const slot = lunchOf(computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods }))

    expect(slot.extras).toHaveLength(1)
  })

  it('returns every slot even when the plan has no line for it', () => {
    const progress = computeDayProgress({ date: DATE, planItems: [riceLine], logs: [], foods })

    expect(progress.slots.map((s) => s.slot)).toEqual([
      'breakfast',
      'lunch',
      'snack',
      'dinner',
      'preWorkout',
      'postWorkout',
    ])
  })

  it('orders the lines within a slot by their plan order', () => {
    const progress = computeDayProgress({
      date: DATE,
      planItems: [chickenLine, riceLine],
      logs: [],
      foods,
    })

    expect(lunchOf(progress).items.map((i) => i.planItem.id)).toEqual(['lunch-rice', 'lunch-chicken'])
  })

  it('aggregates exchange units per category, counting substitutes in their own category', () => {
    const logs = [log({ foodId: 'potato', quantity: quantity(130, 'g'), planItemId: 'lunch-rice' })]
    const progress = computeDayProgress({ date: DATE, planItems: [riceLine, chickenLine], logs, foods })
    const carb = progress.categories.find((c) => c.category === 'carb')!

    expect(carb.plannedUnits).toBeCloseTo(100 / 60, 10)
    expect(carb.consumedUnits).toBeCloseTo(130 / 260, 10)
    expect(carb.remainingUnits).toBeCloseTo(100 / 60 - 0.5, 10)
  })

  it('ignores foods with no exchange table in the category totals', () => {
    const logs = [log({ foodId: 'ketchup-light', quantity: quantity(20, 'g') })]
    const progress = computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods })

    expect(progress.categories.some((c) => c.category === 'other')).toBe(false)
  })

  it('ignores a log whose food is not in the index', () => {
    const logs = [log({ foodId: 'unknown', quantity: quantity(20, 'g'), planItemId: 'lunch-rice' })]
    const item = lunchOf(computeDayProgress({ date: DATE, planItems: [riceLine], logs, foods })).items[0]!

    expect(item.consumed.amount).toBe(0)
    expect(item.unconvertible).toHaveLength(1)
  })
})
