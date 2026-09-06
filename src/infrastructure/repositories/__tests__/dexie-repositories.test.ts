import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DexieFoodRepository } from '../dexie-food-repository'
import { DexieLogRepository } from '../dexie-log-repository'
import { DexiePlanRepository } from '../dexie-plan-repository'
import { DexieSchemaInfo } from '../dexie-schema-info'
import { DexieSettingsRepository } from '../dexie-settings-repository'
import { DietDatabase, SCHEMA_VERSION } from '../../db/schema'
import { seedDatabase } from '../../db/seed-database'
import { SEED_FOODS } from '../../seed/foods'
import { SEED_PLAN } from '../../seed/plan'
import { localDate } from '@/domain/model/local-date'
import { InMemoryLogRepository, FixedClock } from '@/test/fakes/in-memory-repositories'
import { describeLogRepositoryContract } from '@/test/contracts/log-repository.contract'

let counter = 0
const freshDatabase = (): DietDatabase => {
  counter += 1
  return new DietDatabase(`diet-test-${counter}`)
}

describeLogRepositoryContract('the in-memory fake', () => new InMemoryLogRepository())
describeLogRepositoryContract('the Dexie repository', async () => {
  const db = freshDatabase()
  await db.open()
  return new DexieLogRepository(db)
})

describe('seedDatabase', () => {
  let db: DietDatabase

  beforeEach(async () => {
    db = freshDatabase()
    await db.open()
  })

  afterEach(async () => {
    db.close()
  })

  it('loads every food and plan line', async () => {
    await seedDatabase(db)

    await expect(db.foods.count()).resolves.toBe(SEED_FOODS.length)
    await expect(db.planItems.count()).resolves.toBe(SEED_PLAN.length)
  })

  it('records the schema version and the seed hash', async () => {
    const { hash } = await seedDatabase(db)

    const meta = await db.meta.get('singleton')
    expect(meta).toEqual({ id: 'singleton', schemaVersion: SCHEMA_VERSION, seedHash: hash })
  })

  it('is idempotent and does not duplicate rows', async () => {
    await seedDatabase(db)
    const second = await seedDatabase(db)

    expect(second.seeded).toBe(false)
    await expect(db.foods.count()).resolves.toBe(SEED_FOODS.length)
  })

  it('reseeds when the stored seed hash no longer matches', async () => {
    await seedDatabase(db)
    await db.foods.delete('rice')
    await db.meta.put({ id: 'singleton', schemaVersion: SCHEMA_VERSION, seedHash: 'stale' })

    const result = await seedDatabase(db)

    expect(result.seeded).toBe(true)
    await expect(db.foods.get('rice')).resolves.toBeDefined()
  })

  it('leaves the user logs untouched when it reseeds', async () => {
    await seedDatabase(db)
    const logs = new DexieLogRepository(db)
    await logs.add({
      id: 'keep',
      date: localDate('2026-09-06'),
      slot: 'lunch',
      foodId: 'rice',
      quantity: { amount: 150, unit: 'g' },
      planItemId: 'lunch-rice',
      loggedAt: '2026-09-06T13:00:00.000Z',
    })

    await db.meta.put({ id: 'singleton', schemaVersion: SCHEMA_VERSION, seedHash: 'stale' })
    await seedDatabase(db)

    await expect(logs.all()).resolves.toHaveLength(1)
  })
})

describe('DexieFoodRepository', () => {
  let db: DietDatabase

  beforeEach(async () => {
    db = freshDatabase()
    await db.open()
    await seedDatabase(db)
  })

  afterEach(() => db.close())

  it('maps a stored row back into a domain food, both names included', async () => {
    const food = await new DexieFoodRepository(db).byId('rice')

    expect(food).toEqual({
      id: 'rice',
      nameAr: 'أرز',
      nameEn: 'Rice',
      category: 'carb',
      reference: { amount: 60, unit: 'g' },
      source: 'exchange-list:carbohydrates',
    })
  })

  it('keeps the sub group on fats and omits it elsewhere', async () => {
    const repo = new DexieFoodRepository(db)

    expect((await repo.byId('almond'))!.subGroup).toBe('group-1')
    expect((await repo.byId('rice'))!.subGroup).toBeUndefined()
  })

  it('keeps a null reference for foods with no exchange table', async () => {
    expect((await new DexieFoodRepository(db).byId('ketchup-light'))!.reference).toBeNull()
  })

  it('preserves the spoon unit on oils', async () => {
    expect((await new DexieFoodRepository(db).byId('olive-oil'))!.reference).toEqual({ amount: 3, unit: 'tsp' })
  })

  it('returns every food in a category', async () => {
    const carbs = await new DexieFoodRepository(db).byCategory('carb')

    expect(carbs).toHaveLength(SEED_FOODS.filter((f) => f.category === 'carb').length)
    expect(carbs.every((f) => f.category === 'carb')).toBe(true)
  })

  it('returns undefined for an unknown id', async () => {
    await expect(new DexieFoodRepository(db).byId('nope')).resolves.toBeUndefined()
  })
})

describe('DexiePlanRepository', () => {
  let db: DietDatabase

  beforeEach(async () => {
    db = freshDatabase()
    await db.open()
    await seedDatabase(db)
  })

  afterEach(() => db.close())

  it('maps a plan line back with its alternatives and note', async () => {
    const item = await new DexiePlanRepository(db).byId('lunch-poultry-breast')

    expect(item!.quantity).toEqual({ amount: 150, unit: 'g' })
    expect(item!.planAlternativeIds).toEqual(['mullet', 'tilapia', 'liver', 'chicken-liver', 'red-meat'])
    expect(item!.noteAr).toContain('صدر دجاج')
  })

  it('omits an absent note rather than storing an empty string', async () => {
    expect((await new DexiePlanRepository(db).byId('lunch-rice'))!.noteAr).toBeUndefined()
  })

  it('returns every line', async () => {
    await expect(new DexiePlanRepository(db).all()).resolves.toHaveLength(SEED_PLAN.length)
  })
})

describe('DexieSettingsRepository', () => {
  let db: DietDatabase

  beforeEach(async () => {
    db = freshDatabase()
    await db.open()
  })

  afterEach(() => db.close())

  it('starts the plan on the day the app is first opened', async () => {
    const clock = new FixedClock(new Date('2026-09-06T08:00:00'))

    const settings = await new DexieSettingsRepository(db, clock).get()

    expect(settings).toEqual({ locale: 'ar', planStartDate: '2026-09-06', planLengthDays: 15 })
  })

  it('persists the defaults so the start date does not drift the next day', async () => {
    const clock = new FixedClock(new Date('2026-09-06T08:00:00'))
    await new DexieSettingsRepository(db, clock).get()

    clock.set(new Date('2026-09-09T08:00:00'))
    const later = await new DexieSettingsRepository(db, clock).get()

    expect(later.planStartDate).toBe('2026-09-06')
  })

  it('round trips a saved change', async () => {
    const repo = new DexieSettingsRepository(db, new FixedClock(new Date('2026-09-06T08:00:00')))

    await repo.save({ locale: 'en', planStartDate: localDate('2026-10-01'), planLengthDays: 21 })

    await expect(repo.get()).resolves.toEqual({
      locale: 'en',
      planStartDate: '2026-10-01',
      planLengthDays: 21,
    })
  })

  it('falls back to Arabic when a stored locale is not recognised', async () => {
    await db.settings.put({ id: 'singleton', locale: 'fr', planStartDate: '2026-09-06', planLengthDays: 15 })

    const settings = await new DexieSettingsRepository(db, new FixedClock(new Date())).get()

    expect(settings.locale).toBe('ar')
  })
})

describe('DexieSchemaInfo', () => {
  it('reports the stored schema version and seed hash', async () => {
    const db = freshDatabase()
    await db.open()
    const { hash } = await seedDatabase(db)

    await expect(new DexieSchemaInfo(db).get()).resolves.toEqual({
      schemaVersion: SCHEMA_VERSION,
      seedHash: hash,
    })
    db.close()
  })

  it('reports the current version on an unseeded database', async () => {
    const db = freshDatabase()
    await db.open()

    await expect(new DexieSchemaInfo(db).get()).resolves.toEqual({
      schemaVersion: SCHEMA_VERSION,
      seedHash: '',
    })
    db.close()
  })
})
