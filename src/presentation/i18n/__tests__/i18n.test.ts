import { describe, expect, it } from 'vitest'
import { applyDocumentLocale, directionFor, resources } from '..'
import { FOOD_CATEGORIES } from '@/domain/model/category'
import { MEAL_SLOTS } from '@/domain/model/meal-slot'
import { UNITS } from '@/domain/model/unit'

const flatten = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) => flatten(child, prefix === '' ? key : `${prefix}.${key}`))
}

const arabicKeys = flatten(resources.ar.translation).sort()
const englishKeys = flatten(resources.en.translation).sort()

describe('translations', () => {
  it('define exactly the same keys in both languages', () => {
    expect(englishKeys).toEqual(arabicKeys)
  })

  it('leave no empty string in either language', () => {
    for (const bundle of [resources.ar.translation, resources.en.translation]) {
      for (const value of Object.values(bundle).flatMap((group) => Object.values(group))) {
        expect(String(value).trim()).not.toBe('')
      }
    }
  })

  it('cover every meal slot', () => {
    for (const slot of MEAL_SLOTS) {
      expect(arabicKeys).toContain(`slots.${slot}`)
    }
  })

  it('cover every food category', () => {
    for (const category of FOOD_CATEGORIES) {
      expect(arabicKeys).toContain(`categories.${category}`)
    }
  })

  it('cover every unit', () => {
    for (const unit of UNITS) {
      expect(arabicKeys).toContain(`units.${unit}`)
    }
  })

  it('cover every error code the use cases can return', () => {
    const codes = [
      'UNKNOWN_FOOD',
      'UNKNOWN_PLAN_ITEM',
      'NON_POSITIVE_QUANTITY',
      'SLOT_MISMATCH',
      'CATEGORY_MISMATCH',
      'NOT_EXCHANGEABLE',
      'MISSING_REFERENCE',
      'UNIT_MISMATCH',
    ]
    for (const code of codes) {
      expect(arabicKeys).toContain(`errors.${code}`)
    }
  })
})

describe('direction', () => {
  it('is right to left for Arabic and left to right for English', () => {
    expect(directionFor('ar')).toBe('rtl')
    expect(directionFor('en')).toBe('ltr')
  })

  it('stamps the language and direction on the document', () => {
    applyDocumentLocale('ar')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')

    applyDocumentLocale('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
  })
})
