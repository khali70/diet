import { describe, expect, it } from 'vitest'
import { ListPortionHints } from '../list-portion-hints'
import type { PortionHint } from '@/domain/model/portion-hint'
import type { PortionHintReader } from '@/domain/ports/portion-hint-repository'
import { quantity } from '@/domain/model/quantity'

const hint = (foodId: string, labelEn: string, amount: number): PortionHint => ({
  foodId,
  labelAr: labelEn,
  labelEn,
  quantity: quantity(amount, 'g'),
  source: 'usda',
})

const reader = (hints: readonly PortionHint[]): PortionHintReader => ({
  all: () => Promise.resolve(hints),
  byFoodId: (foodId) => Promise.resolve(hints.filter((h) => h.foodId === foodId)),
})

describe('ListPortionHints', () => {
  it('groups the hints by food', async () => {
    const useCase = new ListPortionHints(
      reader([hint('banana', 'Medium banana', 118), hint('banana', 'Large banana', 136), hint('whole-egg', 'Large egg', 50)]),
    )

    const grouped = await useCase.execute()

    expect(grouped.get('banana')?.map((h) => h.quantity.amount)).toEqual([118, 136])
    expect(grouped.get('whole-egg')).toHaveLength(1)
  })

  it('returns nothing for a food with no hints', async () => {
    const grouped = await new ListPortionHints(reader([])).execute()

    expect(grouped.get('rice')).toBeUndefined()
  })
})
