import type { PortionHint } from '@/domain/model/portion-hint'
import type { PortionHintReader } from '@/domain/ports/portion-hint-repository'
import { PORTION_HINTS } from '../seed/portion-hints'

/**
 * The size references ship with the app and never change at runtime, so they
 * are read straight from the bundle rather than from IndexedDB. Keeping them
 * out of the database also keeps them out of backups, where they would be dead
 * weight.
 */
export class StaticPortionHintRepository implements PortionHintReader {
  constructor(private readonly hints: readonly PortionHint[] = PORTION_HINTS) {}

  all(): Promise<readonly PortionHint[]> {
    return Promise.resolve(this.hints)
  }

  byFoodId(foodId: string): Promise<readonly PortionHint[]> {
    return Promise.resolve(this.hints.filter((hint) => hint.foodId === foodId))
  }
}
