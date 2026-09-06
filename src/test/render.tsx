import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { GetDayPool } from '@/application/usecases/get-day-pool'
import { ListPortionHints } from '@/application/usecases/list-portion-hints'
import { StaticPortionHintRepository } from '@/infrastructure/repositories/static-portion-hint-repository'
import { GetDayProgress } from '@/application/usecases/get-day-progress'
import { GetPlanStatus } from '@/application/usecases/get-plan-status'
import { ListExchangesFor } from '@/application/usecases/list-exchanges-for'
import { LogMealEntry } from '@/application/usecases/log-meal-entry'
import { RemoveMealEntry } from '@/application/usecases/remove-meal-entry'
import { ExportBackup } from '@/application/usecases/export-backup'
import { ImportBackup } from '@/application/usecases/import-backup'
import { UpdateSettings } from '@/application/usecases/update-settings'
import type { UseCases } from '@/composition/container'
import type { Food } from '@/domain/model/food'
import { localDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import type { PlanItem } from '@/domain/model/plan-item'
import type { Settings } from '@/domain/model/settings'
import { UseCasesProvider } from '@/presentation/hooks/use-cases'
import { initI18n } from '@/presentation/i18n'
import {
  FixedClock,
  InMemoryFoodRepository,
  InMemoryLogRepository,
  InMemoryPlanRepository,
  InMemorySchemaInfo,
  InMemorySettingsRepository,
  SequentialIdGenerator,
} from './fakes/in-memory-repositories'

export interface Harness {
  useCases: UseCases
  logs: InMemoryLogRepository
  clock: FixedClock
}

/** Wires the screens to in-memory fakes. No Dexie, no real clock. */
export const buildHarness = (options: {
  foods: readonly Food[]
  plan?: readonly PlanItem[]
  logs?: readonly LogEntry[]
  settings?: Partial<Settings>
  now?: Date
}): Harness => {
  const clock = new FixedClock(options.now ?? new Date('2026-09-06T12:00:00'))
  const foods = new InMemoryFoodRepository(options.foods)
  const plans = new InMemoryPlanRepository(options.plan ?? [])
  const logs = new InMemoryLogRepository(options.logs ?? [])
  const settings = new InMemorySettingsRepository({
    locale: 'ar',
    planStartDate: localDate('2026-09-06'),
    planLengthDays: 15,
    ...options.settings,
  })

  const getDayProgress = new GetDayProgress({ plans, logs, foods })

  const useCases: UseCases = {
    getDayProgress,
    getDayPool: new GetDayPool(getDayProgress),
    listPortionHints: new ListPortionHints(new StaticPortionHintRepository()),
    getPlanStatus: new GetPlanStatus(settings, clock),
    listExchangesFor: new ListExchangesFor(foods),
    logMealEntry: new LogMealEntry({ logs, foods, plans, clock, ids: new SequentialIdGenerator('log') }),
    removeMealEntry: new RemoveMealEntry(logs),
    exportBackup: new ExportBackup({ logs, settings, schema: new InMemorySchemaInfo(), clock }),
    importBackup: new ImportBackup({ logWriter: logs, logArchive: logs, settings }),
    updateSettings: new UpdateSettings(settings, settings),
    clock,
    foods,
    settings,
    logArchive: logs,
  }

  return { useCases, logs, clock }
}

export const renderScreen = (
  ui: ReactElement,
  harness: Harness,
  options: { route?: string; language?: 'ar' | 'en' } = {},
): RenderResult => {
  const i18n = initI18n(options.language ?? 'ar')
  void i18n.changeLanguage(options.language ?? 'ar')

  return render(
    <I18nextProvider i18n={i18n}>
      <UseCasesProvider value={harness.useCases}>
        <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
      </UseCasesProvider>
    </I18nextProvider>,
  )
}
