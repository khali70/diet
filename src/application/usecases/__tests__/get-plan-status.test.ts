import { describe, expect, it } from 'vitest'
import { GetPlanStatus } from '../get-plan-status'
import { localDate } from '@/domain/model/local-date'
import { FixedClock, InMemorySettingsRepository } from '@/test/fakes/in-memory-repositories'

const statusOn = (today: string, start = '2026-09-06', length = 15) =>
  new GetPlanStatus(
    new InMemorySettingsRepository({ locale: 'ar', planStartDate: localDate(start), planLengthDays: length }),
    new FixedClock(new Date(`${today}T09:00:00`)),
  ).execute()

describe('GetPlanStatus', () => {
  it('counts the start date as day one', async () => {
    const status = await statusOn('2026-09-06')

    expect(status.dayNumber).toBe(1)
    expect(status.daysRemaining).toBe(14)
    expect(status.cheatMealUnlocked).toBe(false)
  })

  it('reports the last day of the plan', async () => {
    expect((await statusOn('2026-09-06')).endDate).toBe('2026-09-20')
  })

  it('unlocks the cheat meal on the final day', async () => {
    const status = await statusOn('2026-09-20')

    expect(status.dayNumber).toBe(15)
    expect(status.daysRemaining).toBe(0)
    expect(status.cheatMealUnlocked).toBe(true)
  })

  it('keeps the cheat meal unlocked past the end rather than going negative', async () => {
    const status = await statusOn('2026-09-25')

    expect(status.daysRemaining).toBe(0)
    expect(status.cheatMealUnlocked).toBe(true)
  })

  it('reports a day before the start as day zero or below', async () => {
    expect((await statusOn('2026-09-05')).dayNumber).toBe(0)
  })
})
