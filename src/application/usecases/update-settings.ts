import type { Settings } from '@/domain/model/settings'
import type { SettingsReader, SettingsWriter } from '@/domain/ports/settings-repository'

/** Saves a partial change to the user's settings. */
export class UpdateSettings {
  constructor(
    private readonly reader: SettingsReader,
    private readonly writer: SettingsWriter,
  ) {}

  async execute(change: Partial<Settings>): Promise<Settings> {
    const current = await this.reader.get()
    const next: Settings = { ...current, ...change }
    await this.writer.save(next)
    return next
  }
}
