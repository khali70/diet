import { toLocalDate, type LocalDate } from '@/domain/model/local-date'
import type { Clock } from '@/domain/ports/clock'

/** The only place in the app allowed to read the real system clock. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }

  today(): LocalDate {
    return toLocalDate(new Date())
  }
}
