import type { Unit } from './unit'

/** An amount of food. Always carries its unit; never a bare number. */
export interface Quantity {
  readonly amount: number
  readonly unit: Unit
}

export const quantity = (amount: number, unit: Unit): Quantity => ({ amount, unit })

export const sameUnit = (a: Quantity, b: Quantity): boolean => a.unit === b.unit

export const isPositive = (q: Quantity): boolean => q.amount > 0

/** Adds two quantities of the same unit. Callers must check the unit first. */
export const addQuantities = (a: Quantity, b: Quantity): Quantity => {
  if (a.unit !== b.unit) {
    throw new Error(`cannot add quantities with different units: ${a.unit} and ${b.unit}`)
  }
  return quantity(a.amount + b.amount, a.unit)
}

export const scaleQuantity = (q: Quantity, factor: number): Quantity => quantity(q.amount * factor, q.unit)

export const zeroLike = (q: Quantity): Quantity => quantity(0, q.unit)
