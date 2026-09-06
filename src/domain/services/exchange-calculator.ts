import { exchangeError, type ExchangeError } from '../errors/exchange-error'
import { hasExchangeReference, type Food } from '../model/food'
import { isPositive, quantity, type Quantity } from '../model/quantity'
import { err, ok, type Result } from '../shared/result'

/** A computed swap, plus whether the coach would discourage it. */
export interface ExchangeResult {
  readonly quantity: Quantity
  /**
   * True when both foods are fats from different sub groups. The coach's note
   * says to prefer a swap inside the same group. It is allowed, not blocked.
   */
  readonly discouraged: boolean
}

/**
 * Converts a planned amount of one food into the equivalent amount of another,
 * using the rule printed in the coach's exchange list:
 *
 *   targetQty = plannedQty * (referenceQty(target) / referenceQty(source))
 *
 * The worked example in the PDF: 60 g rice and 260 g potato are one exchange
 * each, so 100 g of planned rice becomes 100 * 260 / 60 grams of potato.
 *
 * No rounding happens here. Display precision is a presentation concern.
 */
export const convertExchange = (
  source: Food,
  planned: Quantity,
  target: Food,
): Result<ExchangeResult, ExchangeError> => {
  if (!isPositive(planned)) {
    return err(exchangeError('NON_POSITIVE_QUANTITY', `planned amount must be greater than zero, got ${planned.amount}`))
  }

  if (!hasExchangeReference(source)) {
    return err(exchangeError('NOT_EXCHANGEABLE', `${source.id} has no exchange table`))
  }

  if (!hasExchangeReference(target)) {
    return err(exchangeError('NOT_EXCHANGEABLE', `${target.id} has no exchange table`))
  }

  if (source.category !== target.category) {
    return err(
      exchangeError('CATEGORY_MISMATCH', `cannot swap ${source.category} for ${target.category}`),
    )
  }

  if (planned.unit !== source.reference.unit) {
    return err(
      exchangeError(
        'UNIT_MISMATCH',
        `planned amount is in ${planned.unit} but ${source.id} is measured in ${source.reference.unit}`,
      ),
    )
  }

  if (source.reference.amount <= 0) {
    return err(exchangeError('MISSING_REFERENCE', `${source.id} has a non-positive reference portion`))
  }

  const factor = planned.amount / source.reference.amount
  const amount = target.reference.amount * factor

  return ok({
    quantity: quantity(amount, target.reference.unit),
    discouraged: isCrossSubGroupFatSwap(source, target),
  })
}

/**
 * How many exchange portions a quantity represents, for example 100 g of rice
 * against a 60 g reference is 1.667 carbohydrate exchanges. Unit-free, so it
 * aggregates across a whole category.
 */
export const toExchangeUnits = (food: Food, amount: Quantity): Result<number, ExchangeError> => {
  if (!hasExchangeReference(food)) {
    return err(exchangeError('NOT_EXCHANGEABLE', `${food.id} has no exchange table`))
  }
  if (amount.unit !== food.reference.unit) {
    return err(
      exchangeError('UNIT_MISMATCH', `amount is in ${amount.unit} but ${food.id} is measured in ${food.reference.unit}`),
    )
  }
  if (food.reference.amount <= 0) {
    return err(exchangeError('MISSING_REFERENCE', `${food.id} has a non-positive reference portion`))
  }
  return ok(amount.amount / food.reference.amount)
}

const isCrossSubGroupFatSwap = (source: Food, target: Food): boolean =>
  source.category === 'fat' &&
  source.subGroup !== undefined &&
  target.subGroup !== undefined &&
  source.subGroup !== target.subGroup
