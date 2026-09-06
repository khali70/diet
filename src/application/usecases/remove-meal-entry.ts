import type { LogWriter } from '@/domain/ports/log-repository'

/** Undoes a log entry. */
export class RemoveMealEntry {
  constructor(private readonly logs: LogWriter) {}

  async execute(id: string): Promise<void> {
    await this.logs.remove(id)
  }
}
