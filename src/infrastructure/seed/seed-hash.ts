import type { Food } from '@/domain/model/food'
import type { PlanItem } from '@/domain/model/plan-item'

/**
 * A stable fingerprint of the seeded tables. Stored alongside the data so a
 * backup taken against different coach data is recognisable, and so an
 * accidental seed change is visible in review.
 */
export const seedHash = (foods: readonly Food[], plan: readonly PlanItem[]): string => {
  const parts = [
    ...foods.map((f) => `${f.id}|${f.category}|${f.reference?.amount ?? 'null'}${f.reference?.unit ?? ''}`),
    ...plan.map((p) => `${p.id}|${p.foodId}|${p.quantity.amount}${p.quantity.unit}`),
  ]
  return fnv1a(parts.sort().join('\n'))
}

const fnv1a = (input: string): string => {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
