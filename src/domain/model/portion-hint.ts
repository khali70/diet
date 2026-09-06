import type { Quantity } from './quantity'

/**
 * Where a hint's weight comes from. Nothing here is from the coach's files:
 * the plan and the exchange tables give grams only. These are everyday size
 * references so the user can log a banana without a scale, and the source is
 * carried on every row so the screen can say how solid the number is.
 */
export const HINT_SOURCES = ['usda', 'estimate'] as const
export type HintSource = (typeof HINT_SOURCES)[number]

/** One everyday way to picture a portion, for example a medium banana. */
export interface PortionHint {
  readonly foodId: string
  readonly labelAr: string
  readonly labelEn: string
  /** The weight or spoon count that label stands for. */
  readonly quantity: Quantity
  readonly source: HintSource
}

export const isHintSource = (value: string): value is HintSource =>
  (HINT_SOURCES as readonly string[]).includes(value)
