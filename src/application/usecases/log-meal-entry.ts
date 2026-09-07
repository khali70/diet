import type { LocalDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import type { MealSlot } from '@/domain/model/meal-slot'
import type { Quantity } from '@/domain/model/quantity'
import { isPositive } from '@/domain/model/quantity'
import type { Clock } from '@/domain/ports/clock'
import type { FoodReader } from '@/domain/ports/food-repository'
import type { IdGenerator } from '@/domain/ports/id-generator'
import type { LogWriter } from '@/domain/ports/log-repository'
import type { PlanReader } from '@/domain/ports/plan-repository'
import { err, ok, type Result } from '@/domain/shared/result'

export type LogMealEntryErrorCode =
  | 'UNKNOWN_FOOD'
  | 'UNKNOWN_PLAN_ITEM'
  | 'NON_POSITIVE_QUANTITY'
  | 'SLOT_MISMATCH'
  | 'MISSING_SLOT'

export interface LogMealEntryError {
  readonly code: LogMealEntryErrorCode
  readonly detail: string
}

export interface LogMealEntryInput {
  readonly date: LocalDate
  /** Optional when a plan line is given: the line already says which meal it belongs to. */
  readonly slot?: MealSlot
  readonly foodId: string
  readonly quantity: Quantity
  readonly planItemId?: string | null
}

export interface LogMealEntryDeps {
  readonly logs: LogWriter
  readonly foods: FoodReader
  readonly plans: PlanReader
  readonly clock: Clock
  readonly ids: IdGenerator
}

/** Records something the user actually ate. */
export class LogMealEntry {
  constructor(private readonly deps: LogMealEntryDeps) {}

  async execute(input: LogMealEntryInput): Promise<Result<LogEntry, LogMealEntryError>> {
    if (!isPositive(input.quantity)) {
      return err({ code: 'NON_POSITIVE_QUANTITY', detail: `amount must be greater than zero` })
    }

    const food = await this.deps.foods.byId(input.foodId)
    if (food === undefined) {
      return err({ code: 'UNKNOWN_FOOD', detail: `no food with id ${input.foodId}` })
    }

    const planItemId = input.planItemId ?? null
    let slot = input.slot

    if (planItemId !== null) {
      const planItem = await this.deps.plans.byId(planItemId)
      if (planItem === undefined) {
        return err({ code: 'UNKNOWN_PLAN_ITEM', detail: `no plan item with id ${planItemId}` })
      }
      if (slot === undefined) {
        slot = planItem.slot
      } else if (planItem.slot !== slot) {
        return err({
          code: 'SLOT_MISMATCH',
          detail: `plan item ${planItemId} belongs to ${planItem.slot}, not ${slot}`,
        })
      }
    }

    if (slot === undefined) {
      return err({ code: 'MISSING_SLOT', detail: 'an entry outside the plan must say which meal it belongs to' })
    }

    const entry: LogEntry = {
      id: this.deps.ids.next(),
      date: input.date,
      slot,
      foodId: input.foodId,
      quantity: input.quantity,
      planItemId,
      loggedAt: this.deps.clock.now().toISOString(),
    }

    await this.deps.logs.add(entry)
    return ok(entry)
  }
}
