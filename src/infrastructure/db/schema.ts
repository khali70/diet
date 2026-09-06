import Dexie, { type EntityTable } from 'dexie'
import type { FoodCategory } from '@/domain/model/category'
import type { MealSlot } from '@/domain/model/meal-slot'
import type { Unit } from '@/domain/model/unit'

/**
 * Rows as they are stored. Deliberately flat and primitive so Dexie can index
 * them, and separate from the domain types so a storage change never forces a
 * domain change. Mapping between the two lives in the repositories.
 */

export interface FoodRow {
  id: string
  nameAr: string
  nameEn: string
  category: FoodCategory
  subGroup: string | null
  referenceAmount: number | null
  referenceUnit: Unit | null
  source: string
}

export interface PlanItemRow {
  id: string
  slot: MealSlot
  order: number
  foodId: string
  amount: number
  unit: Unit
  planAlternativeIds: string[]
  noteAr: string | null
  noteEn: string | null
}

export interface LogRow {
  id: string
  date: string
  slot: MealSlot
  foodId: string
  amount: number
  unit: Unit
  planItemId: string | null
  loggedAt: string
}

export interface SettingsRow {
  id: 'singleton'
  locale: string
  planStartDate: string
  planLengthDays: number
}

export interface MetaRow {
  id: 'singleton'
  schemaVersion: number
  seedHash: string
}

/** Bumped with every schema change, alongside an upgrade function. */
export const SCHEMA_VERSION = 1

export class DietDatabase extends Dexie {
  foods!: EntityTable<FoodRow, 'id'>
  planItems!: EntityTable<PlanItemRow, 'id'>
  logs!: EntityTable<LogRow, 'id'>
  settings!: EntityTable<SettingsRow, 'id'>
  meta!: EntityTable<MetaRow, 'id'>

  constructor(name = 'diet') {
    super(name)

    // Version 1: the original shape. Never edit a shipped version; add a new
    // one with an upgrade function instead.
    this.version(1).stores({
      foods: 'id, category',
      planItems: 'id, slot, foodId',
      logs: 'id, date, [date+slot], planItemId',
      settings: 'id',
      meta: 'id',
    })
  }
}
