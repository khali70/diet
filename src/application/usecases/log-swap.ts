import type { LocalDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import type { Quantity } from '@/domain/model/quantity'
import type { PlanReader } from '@/domain/ports/plan-repository'
import { err, ok, type Result } from '@/domain/shared/result'
import type { GetDayProgress } from './get-day-progress'
import type { LogMealEntry, LogMealEntryError } from './log-meal-entry'

export interface LogSwapInput {
  readonly date: LocalDate
  /** The planned line being eaten against, for example today's rice. */
  readonly planItemId: string
  /** What was actually eaten instead, for example sweet potato. */
  readonly foodId: string
  /** How much of the substitute was eaten, not how much was planned. */
  readonly quantity: Quantity
}

export interface LogSwapResult {
  readonly entry: LogEntry
  /** The planned food, so the caller can say what is left of it. */
  readonly plannedFoodId: string
  readonly planned: Quantity
  readonly consumed: Quantity
  readonly remaining: Quantity
  /**
   * False when the substitute could not be converted into the planned food, for
   * example a protein logged against a carbohydrate line. The entry is still
   * recorded, because the user did eat it, but it does not close the line.
   */
  readonly counted: boolean
}

/**
 * Records a substitute against a planned line and answers the only question
 * the user has afterwards: how much of the planned food is still owed.
 *
 * Eating 100 g of sweet potato against a 150 g rice line leaves whatever the
 * exchange tables say is left, which the day progress rules already work out.
 */
export class LogSwap {
  constructor(
    private readonly deps: {
      readonly plans: PlanReader
      readonly logMealEntry: LogMealEntry
      readonly getDayProgress: GetDayProgress
    },
  ) {}

  async execute(input: LogSwapInput): Promise<Result<LogSwapResult, LogMealEntryError>> {
    const planItem = await this.deps.plans.byId(input.planItemId)
    if (planItem === undefined) {
      return err({ code: 'UNKNOWN_PLAN_ITEM', detail: `no plan item with id ${input.planItemId}` })
    }

    const logged = await this.deps.logMealEntry.execute({
      date: input.date,
      foodId: input.foodId,
      quantity: input.quantity,
      planItemId: input.planItemId,
    })
    if (!logged.ok) return logged

    const progress = await this.deps.getDayProgress.execute(input.date)
    const line = progress.slots
      .flatMap((slot) => slot.items)
      .find((item) => item.planItem.id === input.planItemId)

    if (line === undefined) {
      // The line was read a moment ago, so this only happens if the plan changed
      // underneath us. Report it rather than inventing a remainder.
      return err({ code: 'UNKNOWN_PLAN_ITEM', detail: `plan item ${input.planItemId} disappeared while logging` })
    }

    return ok({
      entry: logged.value,
      plannedFoodId: planItem.foodId,
      planned: line.planned,
      consumed: line.consumed,
      remaining: line.remaining,
      counted: !line.unconvertible.some((entry) => entry.id === logged.value.id),
    })
  }
}
