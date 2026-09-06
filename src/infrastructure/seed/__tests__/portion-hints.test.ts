import { describe, expect, it } from 'vitest'
import { HINT_SOURCES } from '@/domain/model/portion-hint'
import { SEED_FOODS } from '../foods'
import { PORTION_HINTS } from '../portion-hints'

const foodIds = new Set(SEED_FOODS.map((food) => food.id))

describe('portion hints', () => {
  it('only references foods that exist, so a typo cannot hide a hint', () => {
    const unknown = PORTION_HINTS.filter((hint) => !foodIds.has(hint.foodId)).map((hint) => hint.foodId)

    expect(unknown).toEqual([])
  })

  it('carries a positive weight for every hint', () => {
    expect(PORTION_HINTS.filter((hint) => hint.quantity.amount <= 0)).toEqual([])
  })

  it('says where every weight came from', () => {
    expect(PORTION_HINTS.filter((hint) => !HINT_SOURCES.includes(hint.source))).toEqual([])
  })

  it('names every hint in both languages', () => {
    const unnamed = PORTION_HINTS.filter((hint) => hint.labelAr.trim() === '' || hint.labelEn.trim() === '')

    expect(unnamed).toEqual([])
  })

  it('does not repeat a label for the same food and unit', () => {
    const keys = PORTION_HINTS.map((hint) => `${hint.foodId}|${hint.quantity.unit}|${hint.labelEn}`)

    expect(new Set(keys).size).toBe(keys.length)
  })

  it('carries no nutrition figures, because the source files contain none', () => {
    const allowed = ['foodId', 'labelAr', 'labelEn', 'quantity', 'source']

    for (const hint of PORTION_HINTS) {
      expect(Object.keys(hint).sort()).toEqual([...allowed].sort())
    }
  })

  it('covers the countable foods the plan actually uses', () => {
    const covered = new Set(PORTION_HINTS.map((hint) => hint.foodId))

    for (const foodId of ['whole-egg', 'banana', 'mango', 'apple', 'potato', 'oats', 'dates', 'skim-milk']) {
      expect(covered.has(foodId)).toBe(true)
    }
  })
})
