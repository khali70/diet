import type { LocalDate } from '../model/local-date'
import type { LogEntry } from '../model/log-entry'
import { MEAL_SLOTS, type MealSlot } from '../model/meal-slot'
import { quantity, type Quantity } from '../model/quantity'
import type { Food } from '../model/food'
import type { DayProgress, PlanItemProgress } from './day-progress'

/**
 * The same food can appear in more than one meal. A pooled food merges those
 * lines into one running total for the day, so the user reads the day as a
 * shopping list rather than as six separate meals.
 *
 * Lines are only merged when they share a unit. Grams and small spoons are not
 * interchangeable, so a food measured both ways stays as two pools.
 */
export interface PooledFood {
  /** Stable identity of the pool: the food plus the unit it is measured in. */
  readonly key: string
  readonly foodId: string
  readonly food: Food | undefined
  readonly planned: Quantity
  readonly consumed: Quantity
  /** Planned minus consumed. Negative means the user went over for the day. */
  readonly remaining: Quantity
  readonly completion: number
  /** Meals the coach placed this food in, in the order they occur in a day. */
  readonly slots: readonly MealSlot[]
  /** The merged lines, in the order they should be filled. */
  readonly lines: readonly PlanItemProgress[]
  readonly entries: readonly LogEntry[]
  readonly unconvertible: readonly LogEntry[]
}

export interface DayPool {
  readonly date: LocalDate
  readonly foods: readonly PooledFood[]
  /** Logged today without belonging to any planned line. */
  readonly extras: readonly LogEntry[]
  readonly completion: number
}

/** Where a newly eaten amount should be recorded. */
export interface PoolAllocation {
  readonly planItemId: string
  readonly slot: MealSlot
  readonly quantity: Quantity
}

export const computeDayPool = (progress: DayProgress): DayPool => {
  const pools = new Map<string, MutablePool>()

  for (const slot of progress.slots) {
    for (const line of slot.items) {
      const key = poolKey(line)
      const pool = pools.get(key) ?? newPool(key, line)
      pool.lines.push(line)
      if (!pool.slots.includes(line.planItem.slot)) pool.slots.push(line.planItem.slot)
      pool.planned += line.planned.amount
      pool.consumed += line.consumed.amount
      pool.entries.push(...line.entries)
      pool.unconvertible.push(...line.unconvertible)
      pools.set(key, pool)
    }
  }

  const foods = [...pools.values()].map(freeze)

  return {
    date: progress.date,
    foods,
    extras: progress.slots.flatMap((slot) => slot.extras),
    completion: progress.completion,
  }
}

/**
 * Splits an amount across the lines behind a pool, filling the earliest unmet
 * line first. Anything left over lands on the last line, so an overshoot stays
 * visible instead of disappearing.
 */
export const allocateToPool = (pool: PooledFood, amount: Quantity): readonly PoolAllocation[] => {
  if (amount.unit !== pool.planned.unit) {
    throw new Error(`Cannot log ${amount.unit} against a pool measured in ${pool.planned.unit}`)
  }
  if (amount.amount <= 0) return []

  const last = pool.lines.at(-1)
  if (last === undefined) return []

  const allocations: PoolAllocation[] = []
  let left = amount.amount

  for (const line of pool.lines) {
    if (left <= 0) break
    const room = line.remaining.amount
    if (room <= 0) continue
    const take = Math.min(room, left)
    allocations.push(allocation(line, take))
    left -= take
  }

  if (left > 0) {
    const overshoot = allocations.at(-1)
    if (overshoot !== undefined && overshoot.planItemId === last.planItem.id) {
      allocations[allocations.length - 1] = allocation(last, overshoot.quantity.amount + left)
    } else {
      allocations.push(allocation(last, left))
    }
  }

  return allocations
}

const allocation = (line: PlanItemProgress, amount: number): PoolAllocation => ({
  planItemId: line.planItem.id,
  slot: line.planItem.slot,
  quantity: quantity(amount, line.planned.unit),
})

interface MutablePool {
  key: string
  foodId: string
  food: Food | undefined
  unit: Quantity['unit']
  planned: number
  consumed: number
  slots: MealSlot[]
  lines: PlanItemProgress[]
  entries: LogEntry[]
  unconvertible: LogEntry[]
}

const poolKey = (line: PlanItemProgress): string => `${line.planItem.foodId}|${line.planned.unit}`

const newPool = (key: string, line: PlanItemProgress): MutablePool => ({
  key,
  foodId: line.planItem.foodId,
  food: line.food,
  unit: line.planned.unit,
  planned: 0,
  consumed: 0,
  slots: [],
  lines: [],
  entries: [],
  unconvertible: [],
})

const freeze = (pool: MutablePool): PooledFood => {
  const planned = quantity(pool.planned, pool.unit)
  return {
    key: pool.key,
    foodId: pool.foodId,
    food: pool.food,
    planned,
    consumed: quantity(pool.consumed, pool.unit),
    remaining: quantity(pool.planned - pool.consumed, pool.unit),
    completion: pool.planned > 0 ? pool.consumed / pool.planned : 0,
    slots: [...pool.slots].sort((a, b) => MEAL_SLOTS.indexOf(a) - MEAL_SLOTS.indexOf(b)),
    lines: pool.lines,
    entries: pool.entries,
    unconvertible: pool.unconvertible,
  }
}
