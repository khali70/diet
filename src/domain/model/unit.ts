/**
 * The coach's tables mix two units: grams for almost everything and
 * "small spoon" for a few oils and butters. They are never silently mixed.
 */
export const UNITS = ['g', 'tsp'] as const

export type Unit = (typeof UNITS)[number]

export const isUnit = (value: string): value is Unit => (UNITS as readonly string[]).includes(value)
