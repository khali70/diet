import { computeDayProgress, type DayProgress } from '@/domain/services/day-progress'
import type { LocalDate } from '@/domain/model/local-date'
import type { FoodReader } from '@/domain/ports/food-repository'
import type { LogReader } from '@/domain/ports/log-repository'
import type { PlanReader } from '@/domain/ports/plan-repository'

export interface GetDayProgressDeps {
  readonly plans: PlanReader
  readonly logs: LogReader
  readonly foods: FoodReader
}

/** Everything the today screen needs for one calendar day. */
export class GetDayProgress {
  constructor(private readonly deps: GetDayProgressDeps) {}

  async execute(date: LocalDate): Promise<DayProgress> {
    const [planItems, logs, foods] = await Promise.all([
      this.deps.plans.all(),
      this.deps.logs.byDate(date),
      this.deps.foods.all(),
    ])

    return computeDayProgress({
      date,
      planItems,
      logs,
      foods: new Map(foods.map((food) => [food.id, food])),
    })
  }
}
