import type { PlanItem } from '@/domain/model/plan-item'
import type { PlanReader } from '@/domain/ports/plan-repository'
import type { DietDatabase } from '../db/schema'
import { toPlanItem } from '../db/mappers'

export class DexiePlanRepository implements PlanReader {
  constructor(private readonly db: DietDatabase) {}

  async all(): Promise<readonly PlanItem[]> {
    return (await this.db.planItems.toArray()).map(toPlanItem)
  }

  async byId(id: string): Promise<PlanItem | undefined> {
    const row = await this.db.planItems.get(id)
    return row === undefined ? undefined : toPlanItem(row)
  }
}
