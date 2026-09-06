import type { LogEntry } from '@/domain/model/log-entry'
import type { Settings } from '@/domain/model/settings'

/** The shape written to disk by export and accepted by import. */
export interface BackupFile {
  readonly formatVersion: number
  readonly schemaVersion: number
  readonly seedHash: string
  readonly exportedAt: string
  readonly settings: Settings
  readonly logs: readonly LogEntry[]
}

/** Bumped only when the backup shape itself changes incompatibly. */
export const BACKUP_FORMAT_VERSION = 1
