import type { MealSlot } from './meal-slot'
import type { Quantity } from './quantity'

/**
 * One line of the coach's plan, for example 150 g grilled chicken breast at
 * lunch.
 *
 * `planAlternativeIds` are the alternatives the coach wrote next to this exact
 * item. They are a different, narrower thing from the global exchange tables
 * and are offered first.
 */
export interface PlanItem {
  readonly id: string
  readonly slot: MealSlot
  readonly order: number
  readonly foodId: string
  readonly quantity: Quantity
  readonly planAlternativeIds: readonly string[]
  /** Free text the coach attached to the item, if any. */
  readonly noteAr?: string
  readonly noteEn?: string
}
