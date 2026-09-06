import type { PlanItem } from '../model/plan-item'

/** Read-only access to the coach's plan lines. */
export interface PlanReader {
  all(): Promise<readonly PlanItem[]>
  byId(id: string): Promise<PlanItem | undefined>
}
