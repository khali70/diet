import type { IdGenerator } from '@/domain/ports/id-generator'

/** The only place in the app allowed to produce random ids. */
export class CryptoIdGenerator implements IdGenerator {
  next(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    // Older browsers, and some private modes, do not expose randomUUID.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}
