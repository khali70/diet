/** The six slots of the plan, in the order they are eaten. */
export const MEAL_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner', 'preWorkout', 'postWorkout'] as const

export type MealSlot = (typeof MEAL_SLOTS)[number]

export const isMealSlot = (value: string): value is MealSlot => (MEAL_SLOTS as readonly string[]).includes(value)
