import { describe, expect, it } from 'vitest'
import { SEED_FOODS } from '../foods'
import { PLAN_ALTERNATIVE_AMOUNTS, SEED_PLAN } from '../plan'
import { seedHash } from '../seed-hash'
import { FOOD_CATEGORIES } from '@/domain/model/category'
import { MEAL_SLOTS } from '@/domain/model/meal-slot'
import { isUnit } from '@/domain/model/unit'

const byId = new Map(SEED_FOODS.map((food) => [food.id, food]))

describe('seeded foods', () => {
  it('has a unique id for every row', () => {
    expect(byId.size).toBe(SEED_FOODS.length)
  })

  it('gives every food both an Arabic and an English name', () => {
    for (const food of SEED_FOODS) {
      expect(food.nameAr.trim(), food.id).not.toBe('')
      expect(food.nameEn.trim(), food.id).not.toBe('')
    }
  })

  it('uses Arabic script for every Arabic name', () => {
    for (const food of SEED_FOODS) {
      expect(/[؀-ۿ]/.test(food.nameAr), `${food.id} -> ${food.nameAr}`).toBe(true)
    }
  })

  it('uses a known category and unit for every row', () => {
    for (const food of SEED_FOODS) {
      expect(FOOD_CATEGORIES).toContain(food.category)
      if (food.reference !== null) expect(isUnit(food.reference.unit)).toBe(true)
    }
  })

  it('gives every exchangeable food a positive reference portion', () => {
    for (const food of SEED_FOODS) {
      if (food.category === 'other') continue
      expect(food.reference, food.id).not.toBeNull()
      expect(food.reference!.amount, food.id).toBeGreaterThan(0)
    }
  })

  it('gives no reference portion to foods with no exchange table', () => {
    for (const food of SEED_FOODS.filter((f) => f.category === 'other')) {
      expect(food.reference, food.id).toBeNull()
    }
  })

  it('records where every row came from', () => {
    for (const food of SEED_FOODS) {
      expect(food.source, food.id).not.toBe('')
    }
  })

  it('carries no calorie or macro fields, which the source PDFs do not contain', () => {
    const allowed = ['id', 'nameAr', 'nameEn', 'category', 'subGroup', 'reference', 'source']

    for (const food of SEED_FOODS) {
      expect(Object.keys(food).sort(), food.id).toEqual(
        allowed.filter((key) => key in food).sort(),
      )
    }
  })

  it('puts every fat in one of the three sub groups the coach printed', () => {
    for (const fat of SEED_FOODS.filter((f) => f.category === 'fat')) {
      expect(['group-1', 'group-2', 'group-3'], fat.id).toContain(fat.subGroup)
    }
  })

  it('transcribes the reference portions used by the worked example', () => {
    expect(byId.get('rice')!.reference).toEqual({ amount: 60, unit: 'g' })
    expect(byId.get('potato')!.reference).toEqual({ amount: 260, unit: 'g' })
  })

  it('keeps oils in small spoons, as the coach printed them', () => {
    expect(byId.get('olive-oil')!.reference!.unit).toBe('tsp')
    expect(byId.get('vegetable-oil')!.reference!.unit).toBe('tsp')
    expect(byId.get('coconut-oil')!.reference!.unit).toBe('tsp')
  })

  it('has rows in every category', () => {
    for (const category of FOOD_CATEGORIES) {
      expect(SEED_FOODS.filter((f) => f.category === category).length, category).toBeGreaterThan(0)
    }
  })

  it('matches the row counts transcribed from the exchange tables', () => {
    const count = (category: string) => SEED_FOODS.filter((f) => f.category === category).length
    expect(count('protein')).toBe(20)
    expect(count('carb')).toBe(21)
    expect(count('fat')).toBe(16)
    expect(count('fruit')).toBe(28)
    expect(count('vegetable')).toBe(17)
    expect(count('dairy')).toBe(4)
    expect(count('legume')).toBe(8)
  })
})

describe('seeded plan', () => {
  it('has a unique id for every line', () => {
    expect(new Set(SEED_PLAN.map((p) => p.id)).size).toBe(SEED_PLAN.length)
  })

  it('points every line at a seeded food', () => {
    for (const item of SEED_PLAN) {
      expect(byId.has(item.foodId), item.id).toBe(true)
    }
  })

  it('points every plan alternative at a seeded food', () => {
    for (const item of SEED_PLAN) {
      for (const alt of item.planAlternativeIds) {
        expect(byId.has(alt), `${item.id} -> ${alt}`).toBe(true)
      }
    }
  })

  it('keeps plan alternatives inside the same category as the line', () => {
    for (const item of SEED_PLAN) {
      const category = byId.get(item.foodId)!.category
      for (const alt of item.planAlternativeIds) {
        expect(byId.get(alt)!.category, `${item.id} -> ${alt}`).toBe(category)
      }
    }
  })

  it('gives every line a positive amount', () => {
    for (const item of SEED_PLAN) {
      expect(item.quantity.amount, item.id).toBeGreaterThan(0)
    }
  })

  it('fills all six slots', () => {
    for (const slot of MEAL_SLOTS) {
      expect(SEED_PLAN.filter((p) => p.slot === slot).length, slot).toBeGreaterThan(0)
    }
  })

  it('numbers the lines within a slot from zero without gaps', () => {
    for (const slot of MEAL_SLOTS) {
      const orders = SEED_PLAN.filter((p) => p.slot === slot).map((p) => p.order)
      expect(orders, slot).toEqual([...orders.keys()])
    }
  })

  it("keeps the coach's own alternative amounts for the lines that have them", () => {
    for (const [planItemId, amounts] of Object.entries(PLAN_ALTERNATIVE_AMOUNTS)) {
      const item = SEED_PLAN.find((p) => p.id === planItemId)
      expect(item, planItemId).toBeDefined()
      expect(Object.keys(amounts).sort()).toEqual([...item!.planAlternativeIds].sort())
    }
  })

  it('transcribes the lunch protein line as written', () => {
    const lunch = SEED_PLAN.find((p) => p.id === 'lunch-poultry-breast')!

    expect(lunch.quantity).toEqual({ amount: 150, unit: 'g' })
    expect(PLAN_ALTERNATIVE_AMOUNTS['lunch-poultry-breast']).toEqual({
      mullet: 180,
      tilapia: 300,
      liver: 150,
      'chicken-liver': 180,
      'red-meat': 150,
    })
  })
})

describe('seedHash', () => {
  it('is stable for unchanged data', () => {
    expect(seedHash(SEED_FOODS, SEED_PLAN)).toBe(seedHash(SEED_FOODS, SEED_PLAN))
  })

  it('changes when a reference portion changes', () => {
    const tampered = SEED_FOODS.map((f) =>
      f.id === 'rice' ? { ...f, reference: { amount: 61, unit: 'g' as const } } : f,
    )

    expect(seedHash(tampered, SEED_PLAN)).not.toBe(seedHash(SEED_FOODS, SEED_PLAN))
  })

  it('changes when a plan amount changes', () => {
    const tampered = SEED_PLAN.map((p) =>
      p.id === 'lunch-rice' ? { ...p, quantity: { amount: 151, unit: 'g' as const } } : p,
    )

    expect(seedHash(SEED_FOODS, tampered)).not.toBe(seedHash(SEED_FOODS, SEED_PLAN))
  })
})
