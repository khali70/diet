import type { PortionHint } from '../model/portion-hint'

/** Read-only access to the everyday size references. They ship with the app and are never user edited. */
export interface PortionHintReader {
  all(): Promise<readonly PortionHint[]>
  byFoodId(foodId: string): Promise<readonly PortionHint[]>
}
