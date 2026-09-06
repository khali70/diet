import { SEED_FOODS } from '../seed/foods'
import { SEED_PLAN } from '../seed/plan'
import { seedHash } from '../seed/seed-hash'
import { toFoodRow, toPlanItemRow } from './mappers'
import { SCHEMA_VERSION, type DietDatabase } from './schema'

/**
 * Loads the coach's tables into the database.
 *
 * Idempotent: running it twice leaves the same rows, so it is safe to call on
 * every start. User logs and settings are never touched. When the seed data
 * itself changes, the stored hash changes and the tables are rewritten.
 */
export const seedDatabase = async (db: DietDatabase): Promise<{ seeded: boolean; hash: string }> => {
  const hash = seedHash(SEED_FOODS, SEED_PLAN)
  const meta = await db.meta.get('singleton')

  if (meta?.seedHash === hash && meta.schemaVersion === SCHEMA_VERSION) {
    return { seeded: false, hash }
  }

  await db.transaction('rw', db.foods, db.planItems, db.meta, async () => {
    await db.foods.clear()
    await db.planItems.clear()
    await db.foods.bulkPut(SEED_FOODS.map(toFoodRow))
    await db.planItems.bulkPut(SEED_PLAN.map(toPlanItemRow))
    await db.meta.put({ id: 'singleton', schemaVersion: SCHEMA_VERSION, seedHash: hash })
  })

  return { seeded: true, hash }
}
