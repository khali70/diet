import type { FoodCategory } from '../model/category'
import type { Food } from '../model/food'

/** Read-only access to the coach's food tables. Foods are seeded, never user edited. */
export interface FoodReader {
  all(): Promise<readonly Food[]>
  byId(id: string): Promise<Food | undefined>
  byCategory(category: FoodCategory): Promise<readonly Food[]>
}
