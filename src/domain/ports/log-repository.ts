import type { LocalDate } from '../model/local-date'
import type { LogEntry } from '../model/log-entry'

export interface LogReader {
  byDate(date: LocalDate): Promise<readonly LogEntry[]>
  betweenDates(from: LocalDate, to: LocalDate): Promise<readonly LogEntry[]>
}

export interface LogWriter {
  add(entry: LogEntry): Promise<void>
  remove(id: string): Promise<void>
  replaceAll(entries: readonly LogEntry[]): Promise<void>
}

/** Whole-history access, used only by backup export. Kept separate so the
 * day screen cannot accidentally load every log ever written. */
export interface LogArchive {
  all(): Promise<readonly LogEntry[]>
}
