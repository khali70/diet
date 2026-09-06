/**
 * A calendar day in the user's own timezone, as YYYY-MM-DD.
 *
 * Meals belong to the local day they were eaten on. A log at 00:30 belongs to
 * that local day, never to the previous UTC one.
 */
export type LocalDate = string & { readonly __brand: 'LocalDate' }

const PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const isLocalDate = (value: string): value is LocalDate => PATTERN.test(value)

export const localDate = (value: string): LocalDate => {
  if (!isLocalDate(value)) throw new Error(`invalid local date: ${value}`)
  return value
}

/** Formats an instant as a local calendar day using the given timezone offset. */
export const toLocalDate = (instant: Date): LocalDate => {
  const y = instant.getFullYear()
  const m = String(instant.getMonth() + 1).padStart(2, '0')
  const d = String(instant.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}` as LocalDate
}

export const addDays = (date: LocalDate, days: number): LocalDate => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const shifted = new Date(y, m - 1, d + days)
  return toLocalDate(shifted)
}

export const daysBetween = (from: LocalDate, to: LocalDate): number => {
  const parse = (v: LocalDate): number => {
    const [y, m, d] = v.split('-').map(Number) as [number, number, number]
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((parse(to) - parse(from)) / 86_400_000)
}
