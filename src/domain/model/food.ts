import type { FoodCategory } from './category'
import type { Quantity } from './quantity'

/**
 * One row of the coach's exchange tables, or a plan-only item with no
 * exchange row (category `other`).
 *
 * `nameAr` is the coach's own wording and is authoritative. `nameEn` is an
 * app-supplied convenience label for the English UI and carries no authority.
 */
export interface Food {
  readonly id: string
  readonly nameAr: string
  readonly nameEn: string
  readonly category: FoodCategory
  /** Fats are split into three groups; swapping inside a group is preferred. */
  readonly subGroup?: string
  /** The portion that is equivalent to every other portion in the category. */
  readonly reference: Quantity | null
  /** Where the row came from, so a wrong number can be traced to a page. */
  readonly source: string
}

export const hasExchangeReference = (food: Food): food is Food & { reference: Quantity } =>
  food.reference !== null && food.category !== 'other'
