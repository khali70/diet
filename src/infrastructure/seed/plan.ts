import type { MealSlot } from '@/domain/model/meal-slot'
import type { PlanItem } from '@/domain/model/plan-item'
import { quantity } from '@/domain/model/quantity'
import type { Unit } from '@/domain/model/unit'

/**
 * The user's own plan, transcribed from `docs/source-pdfs/diet-plan.pdf`.
 *
 * `alternatives` are the swaps the coach wrote next to that exact line. They
 * are narrower than the global exchange tables and are offered first.
 */

interface Line {
  food: string
  amount: number
  unit?: Unit
  alternatives?: readonly string[]
  noteAr?: string
  noteEn?: string
}

const slot = (slot: MealSlot, lines: readonly Line[]): PlanItem[] =>
  lines.map((line, index) => ({
    id: `${slot}-${line.food}`,
    slot,
    order: index,
    foodId: line.food,
    quantity: quantity(line.amount, line.unit ?? 'g'),
    planAlternativeIds: line.alternatives ?? [],
    ...(line.noteAr === undefined ? {} : { noteAr: line.noteAr }),
    ...(line.noteEn === undefined ? {} : { noteEn: line.noteEn }),
  }))

export const SEED_PLAN: readonly PlanItem[] = [
  ...slot('breakfast', [
    { food: 'whole-egg', amount: 150 },
    { food: 'mixed-salad', amount: 100 },
    { food: 'orange-juice', amount: 250 },
    { food: 'foul-medames', amount: 100 },
    { food: 'baladi-bread', amount: 60 },
  ]),
  ...slot('lunch', [
    { food: 'rice', amount: 150, alternatives: ['pasta'] },
    {
      food: 'olive-oil',
      amount: 5,
      noteAr: 'الكمية بالجرام، وجدول البدائل يقيس الزيت بالملاعق الصغيرة',
      noteEn: 'The plan gives grams while the exchange table measures oil in small spoons',
    },
    { food: 'beetroot-salad', amount: 100 },
    {
      food: 'poultry-breast',
      amount: 150,
      alternatives: ['mullet', 'tilapia', 'liver', 'chicken-liver', 'red-meat'],
      noteAr: 'صدر دجاج مشوي، لحم فقط',
      noteEn: 'Grilled chicken breast, meat only',
    },
    { food: 'ketchup-light', amount: 20 },
    { food: 'mayonnaise-light', amount: 10 },
  ]),
  ...slot('snack', [
    { food: 'skim-yogurt', amount: 100 },
    { food: 'mango', amount: 150, alternatives: ['grapes', 'apple', 'banana'] },
  ]),
  ...slot('dinner', [
    { food: 'cucumber', amount: 100 },
    { food: 'cottage-cheese', amount: 150 },
    { food: 'brown-toast', amount: 60 },
  ]),
  ...slot('preWorkout', [
    { food: 'banana', amount: 100 },
    { food: 'turkish-coffee', amount: 100 },
  ]),
  ...slot('postWorkout', [
    {
      food: 'skim-milk',
      amount: 300,
      noteAr: 'ممكن تشربها على مرتين',
      noteEn: 'May be drunk in two parts',
    },
    { food: 'oats', amount: 100 },
    { food: 'dates', amount: 40 },
  ]),
]

/**
 * The coach's alternatives for the lunch protein are written in the plan with
 * their own grams, which differ from a plain exchange conversion. These are
 * the coach's numbers and take priority over the calculated ones.
 */
export const PLAN_ALTERNATIVE_AMOUNTS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'lunch-poultry-breast': { mullet: 180, tilapia: 300, liver: 150, 'chicken-liver': 180, 'red-meat': 150 },
  'lunch-rice': { pasta: 150 },
  'snack-mango': { grapes: 130, apple: 170, banana: 100 },
}
