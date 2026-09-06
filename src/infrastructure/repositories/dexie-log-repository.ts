import type { LocalDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import type { LogArchive, LogReader, LogWriter } from '@/domain/ports/log-repository'
import type { DietDatabase } from '../db/schema'
import { toLogEntry, toLogRow } from '../db/mappers'

export class DexieLogRepository implements LogReader, LogWriter, LogArchive {
  constructor(private readonly db: DietDatabase) {}

  async all(): Promise<readonly LogEntry[]> {
    return (await this.db.logs.toArray()).map(toLogEntry)
  }

  async byDate(date: LocalDate): Promise<readonly LogEntry[]> {
    return (await this.db.logs.where('date').equals(date).toArray()).map(toLogEntry)
  }

  async betweenDates(from: LocalDate, to: LocalDate): Promise<readonly LogEntry[]> {
    return (await this.db.logs.where('date').between(from, to, true, true).toArray()).map(toLogEntry)
  }

  async add(entry: LogEntry): Promise<void> {
    await this.db.logs.put(toLogRow(entry))
  }

  async remove(id: string): Promise<void> {
    await this.db.logs.delete(id)
  }

  async replaceAll(entries: readonly LogEntry[]): Promise<void> {
    await this.db.transaction('rw', this.db.logs, async () => {
      await this.db.logs.clear()
      await this.db.logs.bulkPut(entries.map(toLogRow))
    })
  }
}
