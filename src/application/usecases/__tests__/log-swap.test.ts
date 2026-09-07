import { describe, expect, it } from 'vitest'
import { GetDayProgress } from '../get-day-progress'
import { LogMealEntry } from '../log-meal-entry'
import { LogSwap } from '../log-swap'
import { localDate } from '@/domain/model/local-date'
import type { PlanItem } from '@/domain/model/plan-item'
import { quantity } from '@/domain/model/quantity'
import { chicken, potato, rice } from '@/test/factories'
import {
  FixedClock,
  InMemoryFoodRepository,
  InMemoryLogRepository,
  InMemoryPlanRepository,
  SequentialIdGenerator,
} from '@/test/fakes/in-memory-repositories'

const DATE = localDate('2026-09-06')

const riceLine: PlanItem = {
  id: 'lunch-rice',
  slot: 'lunch',
  order: 0,
  foodId: 'rice',
  quantity: quantity(150, 'g'),
  planAlternativeIds: [],
}

const build = () => {
  const foods = new InMemoryFoodRepository([rice, potato, chicken])
  const plans = new InMemoryPlanRepository([riceLine])
  const logs = new InMemoryLogRepository([])
  const clock = new FixedClock(new Date('2026-09-06T13:00:00'))
  const logMealEntry = new LogMealEntry({ logs, foods, plans, clock, ids: new SequentialIdGenerator('log') })
  const getDayProgress = new GetDayProgress({ plans, logs, foods })

  return { logs, useCase: new LogSwap({ plans, logMealEntry, getDayProgress }) }
}

describe('LogSwap', () => {
  it('takes the meal from the plan line, so the caller does not have to know it', async () => {
    const { logs, useCase } = build()

    await useCase.execute({ date: DATE, planItemId: 'lunch-rice', foodId: 'potato', quantity: quantity(260, 'g') })

    expect((await logs.all())[0]?.slot).toBe('lunch')
  })

  it('reports what is left of the planned food after a partial substitute', async () => {
    const { useCase } = build()

    // 260 g of potato is one rice portion of 60 g, so a 150 g line has 90 g left.
    const result = await useCase.execute({
      date: DATE,
      planItemId: 'lunch-rice',
      foodId: 'potato',
      quantity: quantity(260, 'g'),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.plannedFoodId).toBe('rice')
    expect(result.value.consumed.amount).toBeCloseTo(60)
    expect(result.value.remaining.amount).toBeCloseTo(90)
    expect(result.value.counted).toBe(true)
  })

  it('adds up repeated substitutes against the same line', async () => {
    const { useCase } = build()

    await useCase.execute({ date: DATE, planItemId: 'lunch-rice', foodId: 'potato', quantity: quantity(260, 'g') })
    const second = await useCase.execute({
      date: DATE,
      planItemId: 'lunch-rice',
      foodId: 'rice',
      quantity: quantity(50, 'g'),
    })

    expect(second.ok && second.value.remaining.amount).toBeCloseTo(40)
  })

  it('records a food from another category but says it does not count', async () => {
    const { logs, useCase } = build()

    const result = await useCase.execute({
      date: DATE,
      planItemId: 'lunch-rice',
      foodId: 'chicken',
      quantity: quantity(100, 'g'),
    })

    expect(result.ok && result.value.counted).toBe(false)
    expect(result.ok && result.value.remaining.amount).toBe(150)
    await expect(logs.all()).resolves.toHaveLength(1)
  })

  it('refuses an unknown plan line', async () => {
    const { logs, useCase } = build()

    const result = await useCase.execute({
      date: DATE,
      planItemId: 'nope',
      foodId: 'potato',
      quantity: quantity(100, 'g'),
    })

    expect(result.ok === false && result.error.code).toBe('UNKNOWN_PLAN_ITEM')
    await expect(logs.all()).resolves.toHaveLength(0)
  })

  it('refuses an amount of zero', async () => {
    const { useCase } = build()

    const result = await useCase.execute({
      date: DATE,
      planItemId: 'lunch-rice',
      foodId: 'potato',
      quantity: quantity(0, 'g'),
    })

    expect(result.ok === false && result.error.code).toBe('NON_POSITIVE_QUANTITY')
  })
})
