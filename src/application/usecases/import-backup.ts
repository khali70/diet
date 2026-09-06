import { BACKUP_FORMAT_VERSION, type BackupFile } from '../dto/backup'
import { isLocalDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import { isMealSlot } from '@/domain/model/meal-slot'
import { isLocale } from '@/domain/model/settings'
import { isUnit } from '@/domain/model/unit'
import type { LogArchive, LogWriter } from '@/domain/ports/log-repository'
import type { SettingsWriter } from '@/domain/ports/settings-repository'
import { err, ok, type Result } from '@/domain/shared/result'

export type ImportMode = 'replace' | 'merge'

export type ImportBackupErrorCode = 'MALFORMED' | 'UNSUPPORTED_FORMAT_VERSION'

export interface ImportBackupError {
  readonly code: ImportBackupErrorCode
  readonly detail: string
}

export interface ImportSummary {
  readonly imported: number
  readonly skipped: number
  readonly mode: ImportMode
}

export interface ImportBackupDeps {
  readonly logWriter: LogWriter
  readonly logArchive: LogArchive
  readonly settings: SettingsWriter
}

/**
 * Restores a backup.
 *
 * Validation is strict and happens before anything is written, so a corrupt
 * file leaves the existing database untouched. A file from a future format
 * version is refused rather than guessed at.
 */
export class ImportBackup {
  constructor(private readonly deps: ImportBackupDeps) {}

  async execute(raw: unknown, mode: ImportMode): Promise<Result<ImportSummary, ImportBackupError>> {
    const parsed = parseBackup(raw)
    if (!parsed.ok) return parsed

    const backup = parsed.value

    if (mode === 'replace') {
      await this.deps.logWriter.replaceAll(backup.logs)
      await this.deps.settings.save(backup.settings)
      return ok({ imported: backup.logs.length, skipped: 0, mode })
    }

    const existing = await this.deps.logArchive.all()
    const existingIds = new Set(existing.map((entry) => entry.id))
    const incoming = backup.logs.filter((entry) => !existingIds.has(entry.id))

    for (const entry of incoming) {
      await this.deps.logWriter.add(entry)
    }

    return ok({ imported: incoming.length, skipped: backup.logs.length - incoming.length, mode })
  }
}

const parseBackup = (raw: unknown): Result<BackupFile, ImportBackupError> => {
  if (typeof raw !== 'object' || raw === null) {
    return err({ code: 'MALFORMED', detail: 'backup is not an object' })
  }

  const candidate = raw as Record<string, unknown>

  if (typeof candidate['formatVersion'] !== 'number') {
    return err({ code: 'MALFORMED', detail: 'formatVersion is missing' })
  }
  if (candidate['formatVersion'] > BACKUP_FORMAT_VERSION) {
    return err({
      code: 'UNSUPPORTED_FORMAT_VERSION',
      detail: `backup format ${String(candidate['formatVersion'])} is newer than this app understands`,
    })
  }

  const settings = candidate['settings']
  if (!isSettings(settings)) {
    return err({ code: 'MALFORMED', detail: 'settings are missing or invalid' })
  }

  const logs = candidate['logs']
  if (!Array.isArray(logs)) {
    return err({ code: 'MALFORMED', detail: 'logs are missing' })
  }

  const parsedLogs: LogEntry[] = []
  for (const [index, entry] of logs.entries()) {
    if (!isLogEntry(entry)) {
      return err({ code: 'MALFORMED', detail: `log entry at index ${index} is invalid` })
    }
    parsedLogs.push(entry)
  }

  return ok({
    formatVersion: candidate['formatVersion'],
    schemaVersion: typeof candidate['schemaVersion'] === 'number' ? candidate['schemaVersion'] : 0,
    seedHash: typeof candidate['seedHash'] === 'string' ? candidate['seedHash'] : '',
    exportedAt: typeof candidate['exportedAt'] === 'string' ? candidate['exportedAt'] : '',
    settings,
    logs: parsedLogs,
  })
}

const isSettings = (value: unknown): value is BackupFile['settings'] => {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s['locale'] === 'string' &&
    isLocale(s['locale']) &&
    typeof s['planStartDate'] === 'string' &&
    isLocalDate(s['planStartDate']) &&
    typeof s['planLengthDays'] === 'number' &&
    s['planLengthDays'] > 0
  )
}

const isLogEntry = (value: unknown): value is LogEntry => {
  if (typeof value !== 'object' || value === null) return false
  const e = value as Record<string, unknown>
  const q = e['quantity']
  if (typeof q !== 'object' || q === null) return false
  const quantity = q as Record<string, unknown>

  return (
    typeof e['id'] === 'string' &&
    typeof e['date'] === 'string' &&
    isLocalDate(e['date']) &&
    typeof e['slot'] === 'string' &&
    isMealSlot(e['slot']) &&
    typeof e['foodId'] === 'string' &&
    typeof quantity['amount'] === 'number' &&
    Number.isFinite(quantity['amount']) &&
    typeof quantity['unit'] === 'string' &&
    isUnit(quantity['unit']) &&
    (e['planItemId'] === null || typeof e['planItemId'] === 'string') &&
    typeof e['loggedAt'] === 'string'
  )
}
