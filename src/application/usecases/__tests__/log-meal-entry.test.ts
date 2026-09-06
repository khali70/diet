import { beforeEach, describe, expect, it } from 'vitest'
import { LogMealEntry } from '../log-meal-entry'
import { RemoveMealEntry } from '../remove-meal-entry'
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
  planAlternativeIds: ['potato'],
}

const setup = (instant = new Date('2026-09-06T13:00:00')) => {
  const logs = new InMemoryLogRepository()
  const clock = new FixedClock(instant)
  const useCase = new LogMealEntry({
    logs,
    foods: new InMemoryFoodRepository([rice, potato, chicken]),
    plans: new InMemoryPlanRepository([riceLine]),
    clock,
    ids: new SequentialIdGenerator('log'),
  })
  return { logs, clock, useCase }
}

describe('LogMealEntry', () => {
  let harness: ReturnType<typeof setup>

  beforeEach(() => {
    harness = setup()
  })

  it('stores an entry against a plan line', async () => {
    const result = await harness.useCase.execute({
      date: DATE,
      slot: 'lunch',
      foodId: 'rice',
      quantity: quantity(150, 'g'),
      planItemId: 'lunch-rice',
    })

    expect(result.ok).toBe(true)
    await expect(harness.logs.all()).resolves.toHaveLength(1)
  })

  it('uses the injected id generator rather than randomness', async () => {
    const result = await harness.useCase.execute({
      date: DATE,
      slot: 'lunch',
      foodId: 'rice',
      quantity: quantity(150, 'g'),
    })

    expect(result.ok && result.value.id).toBe('log-1')
  })

  it('stamps the entry with the injected clock, never the system clock', async () => {
    const result = await harness.useCase.execute({
      date: DATE,
      slot: 'lunch',
      foodId: 'rice',
      quantity: quantity(150, 'g'),
    })

    expect(result.ok && result.value.loggedAt).toBe(new Date('2026-09-06T13:00:00').toISOString())
  })

  it('allows an entry with no plan line, for food eaten outside the plan', async () => {
    const result = await harness.useCase.execute({
      date: DATE,
      slot: 'snack',
      foodId: 'potato',
      quantity: quantity(50, 'g'),
    })

    expect(result.ok && result.value.planItemId).toBeNull()
  })

  it('rejects an unknown food', async () => {
    const result = await harness.useCase.execute({
      date: DATE,
      slot: 'lunch',
      foodId: 'nope',
      quantity: quantity(10, 'g'),
    })

    expect(!result.ok && result.error.code).toBe('UNKNOWN_FOOD')
    await expect(harness.logs.all()).resolves.toHaveLength(0)
  })

  it('rejects an unknown plan line', async () => {
    const result = await harness.useCase.execute({
      date: DATE,
      slot: 'lunch',
      foodId: 'rice',
      quantity: quantity(10, 'g'),
      planItemId: 'nope',
    })

    expect(!result.ok && result.error.code).toBe('UNKNOWN_PLAN_ITEM')
  })

  it('rejects a plan line from a different slot', async () => {
    const result = await harness.useCase.execute({
      date: DATE,
      slot: 'dinner',
      foodId: 'rice',
      quantity: quantity(10, 'g'),
      planItemId: 'lunch-rice',
    })

    expect(!result.ok && result.error.code).toBe('SLOT_MISMATCH')
  })

  it('rejects a zero or negative amount', async () => {
    for (const amount of [0, -5]) {
      const result = await harness.useCase.execute({
        date: DATE,
        slot: 'lunch',
        foodId: 'rice',
        quantity: quantity(amount, 'g'),
      })
      expect(!result.ok && result.error.code).toBe('NON_POSITIVE_QUANTITY')
    }
  })

  it('files a late night entry on the local day it was eaten, not the UTC day', async () => {
    const late = setup(new Date('2026-09-06T23:59:00'))
    const early = setup(new Date('2026-09-07T00:01:00'))

    expect(late.clock.today()).toBe('2026-09-06')
    expect(early.clock.today()).toBe('2026-09-07')
  })
})

describe('RemoveMealEntry', () => {
  it('deletes the entry', async () => {
    const { logs, useCase } = setup()
    const created = await useCase.execute({
      date: DATE,
      slot: 'lunch',
      foodId: 'rice',
      quantity: quantity(150, 'g'),
    })
    if (!created.ok) throw new Error('setup failed')

    await new RemoveMealEntry(logs).execute(created.value.id)

    await expect(logs.all()).resolves.toHaveLength(0)
  })
})
