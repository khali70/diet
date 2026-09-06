/** Why a swap between two foods is not possible. */
export type ExchangeErrorCode =
  | 'CATEGORY_MISMATCH'
  | 'NOT_EXCHANGEABLE'
  | 'MISSING_REFERENCE'
  | 'UNIT_MISMATCH'
  | 'NON_POSITIVE_QUANTITY'

export interface ExchangeError {
  readonly code: ExchangeErrorCode
  readonly detail: string
}

export const exchangeError = (code: ExchangeErrorCode, detail: string): ExchangeError => ({ code, detail })
