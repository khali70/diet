import type { LocalDate } from '../model/local-date'

/** Time as a dependency, so the domain never reads the system clock. */
export interface Clock {
  now(): Date
  today(): LocalDate
}
