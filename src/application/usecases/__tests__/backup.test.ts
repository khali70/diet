import { describe, expect, it } from 'vitest'
import { ExportBackup } from '../export-backup'
import { ImportBackup } from '../import-backup'
import { localDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import { quantity } from '@/domain/model/quantity'
import type { Settings } from '@/domain/model/settings'
import {
  FixedClock,
  InMemoryLogRepository,
  InMemorySchemaInfo,
  InMemorySettingsRepository,
} from '@/test/fakes/in-memory-repositories'

const settings: Settings = { locale: 'ar', planStartDate: localDate('2026-09-06'), planLengthDays: 15 }

const entry = (id: string): LogEntry => ({
  id,
  date: localDate('2026-09-06'),
  slot: 'lunch',
  foodId: 'rice',
  quantity: quantity(150, 'g'),
  planItemId: 'lunch-rice',
  loggedAt: '2026-09-06T13:00:00.000Z',
})

const exporterFor = (logs: InMemoryLogRepository, store = new InMemorySettingsRepository(settings)) =>
  new ExportBackup({
    logs,
    settings: store,
    schema: new InMemorySchemaInfo(),
    clock: new FixedClock(new Date('2026-09-06T20:00:00Z')),
  })

const importerFor = (logs: InMemoryLogRepository, store = new InMemorySettingsRepository(settings)) =>
  new ImportBackup({ logWriter: logs, logArchive: logs, settings: store })

describe('ExportBackup', () => {
  it('includes the logs, the settings and the schema identity', async () => {
    const backup = await exporterFor(new InMemoryLogRepository([entry('a')])).execute()

    expect(backup.formatVersion).toBe(1)
    expect(backup.schemaVersion).toBe(1)
    expect(backup.seedHash).toBe('test-hash')
    expect(backup.logs).toHaveLength(1)
    expect(backup.settings.planStartDate).toBe('2026-09-06')
  })

  it('timestamps with the injected clock', async () => {
    const backup = await exporterFor(new InMemoryLogRepository()).execute()

    expect(backup.exportedAt).toBe('2026-09-06T20:00:00.000Z')
  })
})

describe('ImportBackup', () => {
  it('round trips an export back into an identical database', async () => {
    const source = new InMemoryLogRepository([entry('a'), entry('b')])
    const backup = await exporterFor(source).execute()

    const target = new InMemoryLogRepository()
    const targetSettings = new InMemorySettingsRepository({ ...settings, locale: 'en' })
    const result = await importerFor(target, targetSettings).execute(JSON.parse(JSON.stringify(backup)), 'replace')

    expect(result.ok && result.value.imported).toBe(2)
    await expect(target.all()).resolves.toEqual(await source.all())
    await expect(targetSettings.get()).resolves.toEqual(settings)
  })

  it('replaces existing logs in replace mode', async () => {
    const target = new InMemoryLogRepository([entry('old')])
    const backup = await exporterFor(new InMemoryLogRepository([entry('new')])).execute()

    await importerFor(target).execute(JSON.parse(JSON.stringify(backup)), 'replace')

    const stored = await target.all()
    expect(stored.map((e) => e.id)).toEqual(['new'])
  })

  it('keeps existing logs and skips duplicates in merge mode', async () => {
    const target = new InMemoryLogRepository([entry('a')])
    const backup = await exporterFor(new InMemoryLogRepository([entry('a'), entry('b')])).execute()

    const result = await importerFor(target).execute(JSON.parse(JSON.stringify(backup)), 'merge')

    expect(result.ok && result.value).toEqual({ imported: 1, skipped: 1, mode: 'merge' })
    const stored = await target.all()
    expect(stored.map((e) => e.id).sort()).toEqual(['a', 'b'])
  })

  it('refuses a backup from a newer format version', async () => {
    const target = new InMemoryLogRepository()
    const backup = await exporterFor(new InMemoryLogRepository()).execute()

    const result = await importerFor(target).execute({ ...backup, formatVersion: 99 }, 'replace')

    expect(!result.ok && result.error.code).toBe('UNSUPPORTED_FORMAT_VERSION')
  })

  it.each([
    ['not an object', 'null', null],
    ['a missing format version', 'no formatVersion', { settings, logs: [] }],
    ['missing settings', 'no settings', { formatVersion: 1, logs: [] }],
    ['invalid settings', 'bad locale', { formatVersion: 1, settings: { ...settings, locale: 'fr' }, logs: [] }],
    ['missing logs', 'no logs', { formatVersion: 1, settings }],
  ])('rejects %s', async (_name, _detail, raw) => {
    const target = new InMemoryLogRepository([entry('keep')])

    const result = await importerFor(target).execute(raw, 'replace')

    expect(!result.ok && result.error.code).toBe('MALFORMED')
  })

  it('leaves the existing database untouched when the file is corrupt', async () => {
    const target = new InMemoryLogRepository([entry('keep')])
    const backup = await exporterFor(new InMemoryLogRepository([entry('a')])).execute()
    const corrupted = { ...backup, logs: [{ ...entry('bad'), quantity: { amount: 'lots', unit: 'g' } }] }

    const result = await importerFor(target).execute(corrupted, 'replace')

    expect(result.ok).toBe(false)
    const stored = await target.all()
    expect(stored.map((e) => e.id)).toEqual(['keep'])
  })

  it('rejects a log entry with an invalid slot or date', async () => {
    const target = new InMemoryLogRepository()
    const base = await exporterFor(new InMemoryLogRepository([entry('a')])).execute()

    const badSlot = { ...base, logs: [{ ...entry('a'), slot: 'brunch' }] }
    const badDate = { ...base, logs: [{ ...entry('a'), date: '06-09-2026' }] }

    expect((await importerFor(target).execute(badSlot, 'replace')).ok).toBe(false)
    expect((await importerFor(target).execute(badDate, 'replace')).ok).toBe(false)
  })
})
