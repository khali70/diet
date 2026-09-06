import type { FoodCategory } from '../model/category'
import type { Food } from '../model/food'
import type { LocalDate } from '../model/local-date'
import type { LogEntry } from '../model/log-entry'
import { MEAL_SLOTS, type MealSlot } from '../model/meal-slot'
import type { PlanItem } from '../model/plan-item'
import { addQuantities, quantity, zeroLike, type Quantity } from '../model/quantity'
import { convertExchange, toExchangeUnits } from './exchange-calculator'

export type FoodIndex = ReadonlyMap<string, Food>

export interface PlanItemProgress {
  readonly planItem: PlanItem
  readonly food: Food | undefined
  readonly planned: Quantity
  /** Everything logged against this line, expressed in the planned food's unit. */
  readonly consumed: Quantity
  /** Planned minus consumed. Negative means the user went over. */
  readonly remaining: Quantity
  /** 0 when nothing was eaten, 1 when the line is exactly met, above 1 when over. */
  readonly completion: number
  readonly entries: readonly LogEntry[]
  /**
   * Entries attached to this line whose food could not be converted into the
   * planned food, for example a cross category mistake or a missing row. They
   * are surfaced rather than silently dropped.
   */
  readonly unconvertible: readonly LogEntry[]
}

export interface SlotProgress {
  readonly slot: MealSlot
  readonly items: readonly PlanItemProgress[]
  /** Logged in this slot but not attached to any planned line. */
  readonly extras: readonly LogEntry[]
  readonly completion: number
}

export interface CategoryProgress {
  readonly category: FoodCategory
  readonly plannedUnits: number
  readonly consumedUnits: number
  readonly remainingUnits: number
}

export interface DayProgress {
  readonly date: LocalDate
  readonly slots: readonly SlotProgress[]
  readonly categories: readonly CategoryProgress[]
  readonly completion: number
}

/**
 * Works out what is still owed for a day.
 *
 * A logged substitute counts against the line it replaces: 435 g of potato
 * logged against a 100 g rice line closes that line, because the exchange
 * tables say they are the same portion.
 */
export const computeDayProgress = (input: {
  date: LocalDate
  planItems: readonly PlanItem[]
  logs: readonly LogEntry[]
  foods: FoodIndex
}): DayProgress => {
  const { date, planItems, logs, foods } = input

  const itemProgress = planItems.map((planItem) => progressForItem(planItem, logs, foods))
  const attachedIds = new Set(planItems.map((item) => item.id))

  const slots = MEAL_SLOTS.map<SlotProgress>((slot) => {
    const items = itemProgress
      .filter((p) => p.planItem.slot === slot)
      .sort((a, b) => a.planItem.order - b.planItem.order)
    const extras = logs.filter((log) => log.slot === slot && !isAttached(log, attachedIds))
    return { slot, items, extras, completion: averageCompletion(items) }
  })

  return {
    date,
    slots,
    categories: categoryProgress(planItems, logs, foods),
    completion: averageCompletion(itemProgress),
  }
}

const isAttached = (log: LogEntry, planItemIds: ReadonlySet<string>): boolean =>
  log.planItemId !== null && planItemIds.has(log.planItemId)

const progressForItem = (planItem: PlanItem, logs: readonly LogEntry[], foods: FoodIndex): PlanItemProgress => {
  const food = foods.get(planItem.foodId)
  const entries = logs.filter((log) => log.planItemId === planItem.id)

  let consumed = zeroLike(planItem.quantity)
  const unconvertible: LogEntry[] = []

  for (const entry of entries) {
    const contribution = contributionOf(entry, planItem, food, foods)
    if (contribution === null) {
      unconvertible.push(entry)
      continue
    }
    consumed = addQuantities(consumed, contribution)
  }

  const remaining = quantity(planItem.quantity.amount - consumed.amount, planItem.quantity.unit)
  const completion = planItem.quantity.amount > 0 ? consumed.amount / planItem.quantity.amount : 0

  return { planItem, food, planned: planItem.quantity, consumed, remaining, completion, entries, unconvertible }
}

/** How much of the planned line a single log entry satisfies, or null if it cannot be expressed. */
const contributionOf = (
  entry: LogEntry,
  planItem: PlanItem,
  plannedFood: Food | undefined,
  foods: FoodIndex,
): Quantity | null => {
  if (entry.foodId === planItem.foodId) {
    return entry.quantity.unit === planItem.quantity.unit ? entry.quantity : null
  }

  const eaten = foods.get(entry.foodId)
  if (eaten === undefined || plannedFood === undefined) return null

  const converted = convertExchange(eaten, entry.quantity, plannedFood)
  if (!converted.ok) return null
  return converted.value.quantity.unit === planItem.quantity.unit ? converted.value.quantity : null
}

const categoryProgress = (
  planItems: readonly PlanItem[],
  logs: readonly LogEntry[],
  foods: FoodIndex,
): readonly CategoryProgress[] => {
  const planned = new Map<FoodCategory, number>()
  const consumed = new Map<FoodCategory, number>()

  for (const item of planItems) {
    accumulate(planned, foods.get(item.foodId), item.quantity)
  }
  for (const log of logs) {
    accumulate(consumed, foods.get(log.foodId), log.quantity)
  }

  const categories = new Set<FoodCategory>([...planned.keys(), ...consumed.keys()])

  return [...categories]
    .map<CategoryProgress>((category) => {
      const p = planned.get(category) ?? 0
      const c = consumed.get(category) ?? 0
      return { category, plannedUnits: p, consumedUnits: c, remainingUnits: p - c }
    })
    .sort((a, b) => a.category.localeCompare(b.category))
}

const accumulate = (into: Map<FoodCategory, number>, food: Food | undefined, amount: Quantity): void => {
  if (food === undefined) return
  const units = toExchangeUnits(food, amount)
  if (!units.ok) return
  into.set(food.category, (into.get(food.category) ?? 0) + units.value)
}

const averageCompletion = (items: readonly PlanItemProgress[]): number => {
  if (items.length === 0) return 0
  const total = items.reduce((sum, item) => sum + Math.min(item.completion, 1), 0)
  return total / items.length
}
