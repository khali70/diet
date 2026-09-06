import type { Food } from '@/domain/model/food'
import type { FoodCategory } from '@/domain/model/category'
import { quantity } from '@/domain/model/quantity'
import type { Unit } from '@/domain/model/unit'

export const makeFood = (
  id: string,
  category: FoodCategory,
  referenceAmount: number | null,
  options: { unit?: Unit; subGroup?: string } = {},
): Food => ({
  id,
  nameAr: `${id}-ar`,
  nameEn: `${id}-en`,
  category,
  reference: referenceAmount === null ? null : quantity(referenceAmount, options.unit ?? 'g'),
  source: 'test',
  ...(options.subGroup === undefined ? {} : { subGroup: options.subGroup }),
})

/** The two rows the coach's own worked example is built on. */
export const rice = makeFood('rice', 'carb', 60)
export const potato = makeFood('potato', 'carb', 260)
export const chicken = makeFood('chicken', 'protein', 120)
export const oliveOil = makeFood('olive-oil', 'fat', 3, { unit: 'tsp', subGroup: 'group-1' })
export const almond = makeFood('almond', 'fat', 20, { subGroup: 'group-1' })
export const walnut = makeFood('walnut', 'fat', 20, { subGroup: 'group-2' })
export const ketchup = makeFood('ketchup-light', 'other', null)
