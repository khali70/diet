import { describe, expect, it } from 'vitest'
import { UpdateSettings } from '../update-settings'
import { localDate } from '@/domain/model/local-date'
import { InMemorySettingsRepository } from '@/test/fakes/in-memory-repositories'

const initial = { locale: 'ar', planStartDate: localDate('2026-09-06'), planLengthDays: 15 } as const

describe('UpdateSettings', () => {
  it('merges a partial change into the stored settings', async () => {
    const store = new InMemorySettingsRepository({ ...initial })

    const next = await new UpdateSettings(store, store).execute({ locale: 'en' })

    expect(next).toEqual({ ...initial, locale: 'en' })
    await expect(store.get()).resolves.toEqual(next)
  })

  it('leaves untouched fields alone', async () => {
    const store = new InMemorySettingsRepository({ ...initial })

    const next = await new UpdateSettings(store, store).execute({ planStartDate: localDate('2026-10-01') })

    expect(next.locale).toBe('ar')
    expect(next.planLengthDays).toBe(15)
  })
})
