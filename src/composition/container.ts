import type { AppUpdater } from '@/domain/ports/app-updater'
import { GetDayPool } from '@/application/usecases/get-day-pool'
import { LogSwap } from '@/application/usecases/log-swap'
import { ListPortionHints } from '@/application/usecases/list-portion-hints'
import { GetDayProgress } from '@/application/usecases/get-day-progress'
import { GetPlanStatus } from '@/application/usecases/get-plan-status'
import { ListExchangesFor } from '@/application/usecases/list-exchanges-for'
import { LogMealEntry } from '@/application/usecases/log-meal-entry'
import { RemoveMealEntry } from '@/application/usecases/remove-meal-entry'
import { ExportBackup } from '@/application/usecases/export-backup'
import { ImportBackup } from '@/application/usecases/import-backup'
import { UpdateSettings } from '@/application/usecases/update-settings'
import type { Clock } from '@/domain/ports/clock'
import type { FoodReader } from '@/domain/ports/food-repository'
import type { SettingsReader } from '@/domain/ports/settings-repository'
import type { LogArchive } from '@/domain/ports/log-repository'
import { CryptoIdGenerator } from '@/infrastructure/adapters/crypto-id-generator'
import { SystemClock } from '@/infrastructure/adapters/system-clock'
import { DietDatabase } from '@/infrastructure/db/schema'
import { seedDatabase } from '@/infrastructure/db/seed-database'
import { ServiceWorkerUpdater } from '@/infrastructure/adapters/service-worker-updater'
import { StaticPortionHintRepository } from '@/infrastructure/repositories/static-portion-hint-repository'
import { DexieFoodRepository } from '@/infrastructure/repositories/dexie-food-repository'
import { DexieLogRepository } from '@/infrastructure/repositories/dexie-log-repository'
import { DexiePlanRepository } from '@/infrastructure/repositories/dexie-plan-repository'
import { DexieSchemaInfo } from '@/infrastructure/repositories/dexie-schema-info'
import { DexieSettingsRepository } from '@/infrastructure/repositories/dexie-settings-repository'

/**
 * The composition root. This is the only module that knows Dexie exists and
 * the only place concretes are constructed. Everything above it depends on
 * the use cases and the ports, never on an implementation.
 */
export interface UseCases {
  readonly getDayProgress: GetDayProgress
  readonly getDayPool: GetDayPool
  readonly listPortionHints: ListPortionHints
  readonly logSwap: LogSwap
  readonly appUpdater: AppUpdater
  readonly getPlanStatus: GetPlanStatus
  readonly listExchangesFor: ListExchangesFor
  readonly logMealEntry: LogMealEntry
  readonly removeMealEntry: RemoveMealEntry
  readonly exportBackup: ExportBackup
  readonly importBackup: ImportBackup
  readonly updateSettings: UpdateSettings
  readonly clock: Clock
  readonly foods: FoodReader
  readonly settings: SettingsReader
  readonly logArchive: LogArchive
}

export const createContainer = async (databaseName = 'diet'): Promise<UseCases> => {
  const db = new DietDatabase(databaseName)
  await db.open()
  await seedDatabase(db)

  const clock = new SystemClock()
  const ids = new CryptoIdGenerator()

  const foods = new DexieFoodRepository(db)
  const plans = new DexiePlanRepository(db)
  const logs = new DexieLogRepository(db)
  const settings = new DexieSettingsRepository(db, clock)
  const schema = new DexieSchemaInfo(db)

  const getDayProgress = new GetDayProgress({ plans, logs, foods })
  const logMealEntry = new LogMealEntry({ logs, foods, plans, clock, ids })
  const logSwap = new LogSwap({ plans, logMealEntry, getDayProgress })

  return {
    getDayProgress,
    getDayPool: new GetDayPool(getDayProgress),
    logSwap,
    appUpdater: new ServiceWorkerUpdater(),
    listPortionHints: new ListPortionHints(new StaticPortionHintRepository()),
    getPlanStatus: new GetPlanStatus(settings, clock),
    listExchangesFor: new ListExchangesFor(foods),
    logMealEntry,
    removeMealEntry: new RemoveMealEntry(logs),
    exportBackup: new ExportBackup({ logs, settings, schema, clock }),
    importBackup: new ImportBackup({ logWriter: logs, logArchive: logs, settings }),
    updateSettings: new UpdateSettings(settings, settings),
    clock,
    foods,
    settings,
    logArchive: logs,
  }
}
