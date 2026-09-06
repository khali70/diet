/**
 * Exchange categories from the coach's tables. `other` covers plan items that
 * have no exchange table at all (sauces, coffee, mixed salads) and therefore
 * cannot be swapped.
 */
export const FOOD_CATEGORIES = [
  'protein',
  'carb',
  'fat',
  'fruit',
  'vegetable',
  'dairy',
  'legume',
  'other',
] as const

export type FoodCategory = (typeof FOOD_CATEGORIES)[number]

/** Categories that expose an exchange table the user can swap within. */
export const EXCHANGEABLE_CATEGORIES: readonly FoodCategory[] = FOOD_CATEGORIES.filter((c) => c !== 'other')

export const isExchangeable = (category: FoodCategory): boolean => category !== 'other'
