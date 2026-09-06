import type { LocalDate } from './local-date'
import type { MealSlot } from './meal-slot'
import type { Quantity } from './quantity'

/**
 * Something actually eaten.
 *
 * `planItemId` is set when the entry counts against a planned line, including
 * when the user ate a substitute food for it. It is null for anything eaten
 * outside the plan.
 */
export interface LogEntry {
  readonly id: string
  readonly date: LocalDate
  readonly slot: MealSlot
  readonly foodId: string
  readonly quantity: Quantity
  readonly planItemId: string | null
  readonly loggedAt: string
}
