import type { PortionHint } from '@/domain/model/portion-hint'
import type { PortionHintReader } from '@/domain/ports/portion-hint-repository'

/**
 * The size references, grouped by food, so a screen can look them up without
 * filtering a flat list on every render.
 */
export class ListPortionHints {
  constructor(private readonly hints: PortionHintReader) {}

  async execute(): Promise<ReadonlyMap<string, readonly PortionHint[]>> {
    const grouped = new Map<string, PortionHint[]>()

    for (const hint of await this.hints.all()) {
      const existing = grouped.get(hint.foodId)
      if (existing === undefined) grouped.set(hint.foodId, [hint])
      else existing.push(hint)
    }

    return grouped
  }
}
