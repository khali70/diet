import { BACKUP_FORMAT_VERSION, type BackupFile } from '../dto/backup'
import type { Clock } from '@/domain/ports/clock'
import type { LogArchive } from '@/domain/ports/log-repository'
import type { SchemaInfoReader } from '@/domain/ports/schema-info'
import type { SettingsReader } from '@/domain/ports/settings-repository'

export interface ExportBackupDeps {
  readonly logs: LogArchive
  readonly settings: SettingsReader
  readonly schema: SchemaInfoReader
  readonly clock: Clock
}

/**
 * Produces a self describing snapshot of everything the user cannot get back:
 * their settings and their logs. Foods and plan lines are seeded from the
 * PDFs and are deliberately not included.
 */
export class ExportBackup {
  constructor(private readonly deps: ExportBackupDeps) {}

  async execute(): Promise<BackupFile> {
    const [logs, settings, schema] = await Promise.all([
      this.deps.logs.all(),
      this.deps.settings.get(),
      this.deps.schema.get(),
    ])

    return {
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: schema.schemaVersion,
      seedHash: schema.seedHash,
      exportedAt: this.deps.clock.now().toISOString(),
      settings,
      logs,
    }
  }
}
