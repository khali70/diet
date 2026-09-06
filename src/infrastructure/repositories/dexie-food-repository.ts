import type { FoodCategory } from '@/domain/model/category'
import type { Food } from '@/domain/model/food'
import type { FoodReader } from '@/domain/ports/food-repository'
import type { DietDatabase } from '../db/schema'
import { toFood } from '../db/mappers'

export class DexieFoodRepository implements FoodReader {
  constructor(private readonly db: DietDatabase) {}

  async all(): Promise<readonly Food[]> {
    return (await this.db.foods.toArray()).map(toFood)
  }

  async byId(id: string): Promise<Food | undefined> {
    const row = await this.db.foods.get(id)
    return row === undefined ? undefined : toFood(row)
  }

  async byCategory(category: FoodCategory): Promise<readonly Food[]> {
    return (await this.db.foods.where('category').equals(category).toArray()).map(toFood)
  }
}
