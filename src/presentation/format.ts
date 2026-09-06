import type { TFunction } from 'i18next'
import type { Quantity } from '@/domain/model/quantity'

/**
 * Display formatting lives here, never in the domain. The domain returns exact
 * values such as 433.3333; deciding to show 433 is a presentation choice.
 */

/** Grams are shown whole; spoons keep one decimal so half a spoon is visible. */
export const formatAmount = (quantity: Quantity): string => {
  const decimals = quantity.unit === 'g' ? 0 : 1
  const rounded = Number(quantity.amount.toFixed(decimals))
  return String(rounded)
}

export const formatQuantity = (quantity: Quantity, t: TFunction): string =>
  `${formatAmount(quantity)} ${t(`units.${quantity.unit}`)}`

export const formatExchangeUnits = (units: number, t: TFunction): string =>
  `${Number(units.toFixed(2))} ${t('units.exchange')}`

export const formatPercent = (ratio: number): string => `${Math.round(ratio * 100)}%`
