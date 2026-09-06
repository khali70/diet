import { describe, expect, it } from 'vitest'
import { GetDayProgress } from '../get-day-progress'
import { localDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import type { PlanItem } from '@/domain/model/plan-item'
import { quantity } from '@/domain/model/quantity'
import { potato, rice } from '@/test/factories'
import {
  InMemoryFoodRepository,
  InMemoryLogRepository,
  InMemoryPlanRepository,
} from '@/test/fakes/in-memory-repositories'

const TODAY = localDate('2026-09-06')
const YESTERDAY = localDate('2026-09-05')

const riceLine: PlanItem = {
  id: 'lunch-rice',
  slot: 'lunch',
  order: 0,
  foodId: 'rice',
  quantity: quantity(100, 'g'),
  planAlternativeIds: [],
}

const entry = (date = TODAY, amount = 40): LogEntry => ({
  id: `log-${date}-${amount}`,
  date,
  slot: 'lunch',
  foodId: 'rice',
  quantity: quantity(amount, 'g'),
  planItemId: 'lunch-rice',
  loggedAt: `${date}T13:00:00.000Z`,
})

const useCase = (logs: readonly LogEntry[]) =>
  new GetDayProgress({
    plans: new InMemoryPlanRepository([riceLine]),
    logs: new InMemoryLogRepository(logs),
    foods: new InMemoryFoodRepository([rice, potato]),
  })

describe('GetDayProgress', () => {
  it('reports progress for the requested day only', async () => {
    const progress = await useCase([entry(TODAY, 40), entry(YESTERDAY, 100)]).execute(TODAY)
    const item = progress.slots.find((s) => s.slot === 'lunch')!.items[0]!

    expect(item.consumed.amount).toBe(40)
    expect(item.remaining.amount).toBe(60)
  })

  it('returns the requested date on the result', async () => {
    expect((await useCase([]).execute(TODAY)).date).toBe(TODAY)
  })

  it('returns a full plan with nothing consumed for a day with no logs', async () => {
    const progress = await useCase([]).execute(YESTERDAY)

    expect(progress.completion).toBe(0)
    expect(progress.slots.find((s) => s.slot === 'lunch')!.items).toHaveLength(1)
  })
})
