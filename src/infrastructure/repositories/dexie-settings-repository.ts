import { DEFAULT_PLAN_LENGTH_DAYS, type Settings } from '@/domain/model/settings'
import type { Clock } from '@/domain/ports/clock'
import type { SettingsReader, SettingsWriter } from '@/domain/ports/settings-repository'
import type { DietDatabase } from '../db/schema'
import { toSettings, toSettingsRow } from '../db/mappers'

export class DexieSettingsRepository implements SettingsReader, SettingsWriter {
  constructor(
    private readonly db: DietDatabase,
    private readonly clock: Clock,
  ) {}

  async get(): Promise<Settings> {
    const row = await this.db.settings.get('singleton')
    if (row === undefined) {
      // First run: the plan starts the day the app is first opened.
      const defaults: Settings = {
        locale: 'ar',
        planStartDate: this.clock.today(),
        planLengthDays: DEFAULT_PLAN_LENGTH_DAYS,
      }
      await this.save(defaults)
      return defaults
    }
    return toSettings(row)
  }

  async save(settings: Settings): Promise<void> {
    await this.db.settings.put(toSettingsRow(settings))
  }
}
