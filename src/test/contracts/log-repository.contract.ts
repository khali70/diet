import { describe, expect, it } from 'vitest'
import { localDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import type { LogArchive, LogReader, LogWriter } from '@/domain/ports/log-repository'
import { quantity } from '@/domain/model/quantity'

export type LogRepository = LogReader & LogWriter & LogArchive

const entry = (id: string, date: string, over: Partial<LogEntry> = {}): LogEntry => ({
  id,
  date: localDate(date),
  slot: 'lunch',
  foodId: 'rice',
  quantity: quantity(150, 'g'),
  planItemId: 'lunch-rice',
  loggedAt: `${date}T13:00:00.000Z`,
  ...over,
})

/**
 * One suite, run against every implementation of the port. This is what makes
 * the in-memory fake and the Dexie repository genuinely substitutable rather
 * than merely similar.
 */
export const describeLogRepositoryContract = (
  name: string,
  createRepository: () => Promise<LogRepository> | LogRepository,
): void => {
  describe(`${name} satisfies the log repository contract`, () => {
    it('stores and returns an entry', async () => {
      const repo = await createRepository()

      await repo.add(entry('a', '2026-09-06'))

      await expect(repo.all()).resolves.toEqual([entry('a', '2026-09-06')])
    })

    it('returns only the entries for the requested day', async () => {
      const repo = await createRepository()
      await repo.add(entry('a', '2026-09-06'))
      await repo.add(entry('b', '2026-09-07'))

      const found = await repo.byDate(localDate('2026-09-06'))

      expect(found.map((e) => e.id)).toEqual(['a'])
    })

    it('returns an empty list for a day with nothing logged', async () => {
      const repo = await createRepository()

      await expect(repo.byDate(localDate('2026-09-06'))).resolves.toEqual([])
    })

    it('returns entries in an inclusive date range', async () => {
      const repo = await createRepository()
      for (const [id, date] of [
        ['a', '2026-09-05'],
        ['b', '2026-09-06'],
        ['c', '2026-09-07'],
        ['d', '2026-09-08'],
      ] as const) {
        await repo.add(entry(id, date))
      }

      const found = await repo.betweenDates(localDate('2026-09-06'), localDate('2026-09-07'))

      expect(found.map((e) => e.id).sort()).toEqual(['b', 'c'])
    })

    it('removes an entry by id', async () => {
      const repo = await createRepository()
      await repo.add(entry('a', '2026-09-06'))
      await repo.add(entry('b', '2026-09-06'))

      await repo.remove('a')

      const remaining = await repo.all()
      expect(remaining.map((e) => e.id)).toEqual(['b'])
    })

    it('ignores a removal of an id that is not there', async () => {
      const repo = await createRepository()
      await repo.add(entry('a', '2026-09-06'))

      await repo.remove('missing')

      await expect(repo.all()).resolves.toHaveLength(1)
    })

    it('replaces the whole set', async () => {
      const repo = await createRepository()
      await repo.add(entry('old', '2026-09-06'))

      await repo.replaceAll([entry('new', '2026-09-07')])

      const stored = await repo.all()
      expect(stored.map((e) => e.id)).toEqual(['new'])
    })

    it('empties the set when replacing with nothing', async () => {
      const repo = await createRepository()
      await repo.add(entry('a', '2026-09-06'))

      await repo.replaceAll([])

      await expect(repo.all()).resolves.toEqual([])
    })

    it('preserves an entry that is not attached to a plan line', async () => {
      const repo = await createRepository()

      await repo.add(entry('a', '2026-09-06', { planItemId: null }))

      const [stored] = await repo.all()
      expect(stored!.planItemId).toBeNull()
    })

    it('preserves the quantity and its unit exactly', async () => {
      const repo = await createRepository()

      await repo.add(entry('a', '2026-09-06', { quantity: quantity(433.3333333333333, 'g') }))

      const [stored] = await repo.all()
      expect(stored!.quantity).toEqual({ amount: 433.3333333333333, unit: 'g' })
    })

    it('overwrites an entry stored again with the same id', async () => {
      const repo = await createRepository()
      await repo.add(entry('a', '2026-09-06'))

      await repo.add(entry('a', '2026-09-06', { quantity: quantity(75, 'g') }))

      const stored = await repo.all()
      expect(stored).toHaveLength(1)
      expect(stored[0]!.quantity.amount).toBe(75)
    })
  })
}
