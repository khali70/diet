import { addDays, daysBetween, type LocalDate } from '@/domain/model/local-date'
import type { Clock } from '@/domain/ports/clock'
import type { SettingsReader } from '@/domain/ports/settings-repository'

export interface PlanStatus {
  readonly startDate: LocalDate
  readonly endDate: LocalDate
  /** Day 1 on the start date itself. */
  readonly dayNumber: number
  readonly totalDays: number
  readonly daysRemaining: number
  /** The coach allows a single cheat meal at the end of the plan period. */
  readonly cheatMealUnlocked: boolean
}

/** Where the user is in the plan cycle, for the cheat meal countdown. */
export class GetPlanStatus {
  constructor(
    private readonly settings: SettingsReader,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<PlanStatus> {
    const { planStartDate, planLengthDays } = await this.settings.get()
    const today = this.clock.today()
    const elapsed = daysBetween(planStartDate, today)
    const dayNumber = elapsed + 1
    const endDate = addDays(planStartDate, planLengthDays - 1)

    return {
      startDate: planStartDate,
      endDate,
      dayNumber,
      totalDays: planLengthDays,
      daysRemaining: Math.max(planLengthDays - dayNumber, 0),
      cheatMealUnlocked: dayNumber >= planLengthDays,
    }
  }
}
