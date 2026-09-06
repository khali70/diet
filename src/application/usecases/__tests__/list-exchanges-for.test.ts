import { describe, expect, it } from 'vitest'
import { ListExchangesFor } from '../list-exchanges-for'
import { quantity } from '@/domain/model/quantity'
import { almond, chicken, ketchup, oliveOil, potato, rice, walnut } from '@/test/factories'
import { InMemoryFoodRepository } from '@/test/fakes/in-memory-repositories'

const repo = new InMemoryFoodRepository([rice, potato, chicken, almond, oliveOil, walnut, ketchup])
const useCase = new ListExchangesFor(repo)

describe('ListExchangesFor', () => {
  it('lists every food in the same category with its converted amount', async () => {
    const result = await useCase.execute({ foodId: 'rice', quantity: quantity(100, 'g') })
    if (!result.ok) throw new Error(result.error.detail)

    expect(result.value.map((o) => o.food.id)).toEqual(['potato'])
    expect(result.value[0]!.quantity.amount).toBeCloseTo((100 * 260) / 60, 10)
  })

  it('never offers the source food as its own alternative', async () => {
    const result = await useCase.execute({ foodId: 'rice', quantity: quantity(100, 'g') })

    expect(result.ok && result.value.some((o) => o.food.id === 'rice')).toBe(false)
  })

  it('never crosses categories', async () => {
    const result = await useCase.execute({ foodId: 'rice', quantity: quantity(100, 'g') })

    expect(result.ok && result.value.every((o) => o.food.category === 'carb')).toBe(true)
  })

  it("ranks the coach's own alternatives for the line first", async () => {
    const result = await useCase.execute({
      foodId: 'almond',
      quantity: quantity(20, 'g'),
      planAlternativeIds: ['walnut'],
    })
    if (!result.ok) throw new Error(result.error.detail)

    expect(result.value[0]!.food.id).toBe('walnut')
    expect(result.value[0]!.fromPlan).toBe(true)
  })

  it('ranks same sub group fats above other sub groups', async () => {
    const result = await useCase.execute({ foodId: 'almond', quantity: quantity(20, 'g') })
    if (!result.ok) throw new Error(result.error.detail)

    expect(result.value[0]!.food.id).toBe('olive-oil')
    expect(result.value.at(-1)!.food.id).toBe('walnut')
  })

  it('marks a cross sub group fat swap as discouraged', async () => {
    const result = await useCase.execute({ foodId: 'almond', quantity: quantity(20, 'g') })
    if (!result.ok) throw new Error(result.error.detail)

    expect(result.value.find((o) => o.food.id === 'walnut')!.discouraged).toBe(true)
    expect(result.value.find((o) => o.food.id === 'olive-oil')!.discouraged).toBe(false)
  })

  it('rejects an unknown food', async () => {
    const result = await useCase.execute({ foodId: 'nope', quantity: quantity(10, 'g') })

    expect(!result.ok && result.error.code).toBe('UNKNOWN_FOOD')
  })

  it('rejects a food that has no exchange table', async () => {
    const result = await useCase.execute({ foodId: 'ketchup-light', quantity: quantity(20, 'g') })

    expect(!result.ok && result.error.code).toBe('NOT_EXCHANGEABLE')
  })

  it('rejects an amount whose unit does not match the source table', async () => {
    const result = await useCase.execute({ foodId: 'olive-oil', quantity: quantity(15, 'g') })

    expect(!result.ok && result.error.code).toBe('UNIT_MISMATCH')
  })
})
