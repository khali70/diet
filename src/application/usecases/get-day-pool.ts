import { computeDayPool, type DayPool } from '@/domain/services/day-pool'
import type { LocalDate } from '@/domain/model/local-date'
import type { GetDayProgress } from './get-day-progress'

/**
 * The day as one list of foods instead of six meals. The user eats through a
 * single bulk of food and records against it, so the screen needs totals per
 * food rather than per meal line.
 */
export class GetDayPool {
  constructor(private readonly getDayProgress: GetDayProgress) {}

  async execute(date: LocalDate): Promise<DayPool> {
    return computeDayPool(await this.getDayProgress.execute(date))
  }
}
