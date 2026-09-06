import type { FoodCategory } from '@/domain/model/category'
import type { Food } from '@/domain/model/food'
import type { LocalDate } from '@/domain/model/local-date'
import { toLocalDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import type { PlanItem } from '@/domain/model/plan-item'
import type { Settings } from '@/domain/model/settings'
import type { Clock } from '@/domain/ports/clock'
import type { FoodReader } from '@/domain/ports/food-repository'
import type { IdGenerator } from '@/domain/ports/id-generator'
import type { LogArchive, LogReader, LogWriter } from '@/domain/ports/log-repository'
import type { PlanReader } from '@/domain/ports/plan-repository'
import type { SchemaInfo, SchemaInfoReader } from '@/domain/ports/schema-info'
import type { SettingsReader, SettingsWriter } from '@/domain/ports/settings-repository'

export class InMemoryFoodRepository implements FoodReader {
  constructor(private readonly foods: readonly Food[]) {}

  all(): Promise<readonly Food[]> {
    return Promise.resolve(this.foods)
  }

  byId(id: string): Promise<Food | undefined> {
    return Promise.resolve(this.foods.find((food) => food.id === id))
  }

  byCategory(category: FoodCategory): Promise<readonly Food[]> {
    return Promise.resolve(this.foods.filter((food) => food.category === category))
  }
}

export class InMemoryPlanRepository implements PlanReader {
  constructor(private readonly items: readonly PlanItem[]) {}

  all(): Promise<readonly PlanItem[]> {
    return Promise.resolve(this.items)
  }

  byId(id: string): Promise<PlanItem | undefined> {
    return Promise.resolve(this.items.find((item) => item.id === id))
  }
}

export class InMemoryLogRepository implements LogReader, LogWriter, LogArchive {
  private entries: LogEntry[]

  constructor(entries: readonly LogEntry[] = []) {
    this.entries = [...entries]
  }

  all(): Promise<readonly LogEntry[]> {
    return Promise.resolve([...this.entries])
  }

  byDate(date: LocalDate): Promise<readonly LogEntry[]> {
    return Promise.resolve(this.entries.filter((entry) => entry.date === date))
  }

  betweenDates(from: LocalDate, to: LocalDate): Promise<readonly LogEntry[]> {
    return Promise.resolve(this.entries.filter((entry) => entry.date >= from && entry.date <= to))
  }

  add(entry: LogEntry): Promise<void> {
    // Upsert by id, matching the Dexie implementation's put semantics.
    const existing = this.entries.findIndex((e) => e.id === entry.id)
    if (existing === -1) this.entries.push(entry)
    else this.entries[existing] = entry
    return Promise.resolve()
  }

  remove(id: string): Promise<void> {
    this.entries = this.entries.filter((entry) => entry.id !== id)
    return Promise.resolve()
  }

  replaceAll(entries: readonly LogEntry[]): Promise<void> {
    this.entries = [...entries]
    return Promise.resolve()
  }
}

export class InMemorySettingsRepository implements SettingsReader, SettingsWriter {
  constructor(private settings: Settings) {}

  get(): Promise<Settings> {
    return Promise.resolve(this.settings)
  }

  save(settings: Settings): Promise<void> {
    this.settings = settings
    return Promise.resolve()
  }
}

export class InMemorySchemaInfo implements SchemaInfoReader {
  constructor(private readonly info: SchemaInfo = { schemaVersion: 1, seedHash: 'test-hash' }) {}

  get(): Promise<SchemaInfo> {
    return Promise.resolve(this.info)
  }
}

/** A clock frozen at a chosen instant, so day boundaries can be tested. */
export class FixedClock implements Clock {
  constructor(private instant: Date) {}

  now(): Date {
    return new Date(this.instant)
  }

  today(): LocalDate {
    return toLocalDate(this.instant)
  }

  set(instant: Date): void {
    this.instant = instant
  }
}

/** Predictable ids, so assertions do not depend on randomness. */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0

  constructor(private readonly prefix = 'id') {}

  next(): string {
    this.counter += 1
    return `${this.prefix}-${this.counter}`
  }
}
