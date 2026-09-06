import type { Settings } from '../model/settings'

export interface SettingsReader {
  get(): Promise<Settings>
}

export interface SettingsWriter {
  save(settings: Settings): Promise<void>
}
