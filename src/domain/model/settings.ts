import type { LocalDate } from './local-date'

export const LOCALES = ['ar', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value)

/** How many days the coach's plan runs before the single cheat meal. */
export const DEFAULT_PLAN_LENGTH_DAYS = 15

export interface Settings {
  readonly locale: Locale
  readonly planStartDate: LocalDate
  readonly planLengthDays: number
}
