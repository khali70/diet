import type { Food } from '@/domain/model/food'
import { localDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import type { PlanItem } from '@/domain/model/plan-item'
import { quantity } from '@/domain/model/quantity'
import type { Settings } from '@/domain/model/settings'
import { isLocale } from '@/domain/model/settings'
import type { FoodRow, LogRow, PlanItemRow, SettingsRow } from './schema'

/** Storage rows in, domain objects out. Kept out of the domain on purpose. */

export const toFood = (row: FoodRow): Food => ({
  id: row.id,
  nameAr: row.nameAr,
  nameEn: row.nameEn,
  category: row.category,
  reference:
    row.referenceAmount === null || row.referenceUnit === null
      ? null
      : quantity(row.referenceAmount, row.referenceUnit),
  source: row.source,
  ...(row.subGroup === null ? {} : { subGroup: row.subGroup }),
})

export const toFoodRow = (food: Food): FoodRow => ({
  id: food.id,
  nameAr: food.nameAr,
  nameEn: food.nameEn,
  category: food.category,
  subGroup: food.subGroup ?? null,
  referenceAmount: food.reference?.amount ?? null,
  referenceUnit: food.reference?.unit ?? null,
  source: food.source,
})

export const toPlanItem = (row: PlanItemRow): PlanItem => ({
  id: row.id,
  slot: row.slot,
  order: row.order,
  foodId: row.foodId,
  quantity: quantity(row.amount, row.unit),
  planAlternativeIds: row.planAlternativeIds,
  ...(row.noteAr === null ? {} : { noteAr: row.noteAr }),
  ...(row.noteEn === null ? {} : { noteEn: row.noteEn }),
})

export const toPlanItemRow = (item: PlanItem): PlanItemRow => ({
  id: item.id,
  slot: item.slot,
  order: item.order,
  foodId: item.foodId,
  amount: item.quantity.amount,
  unit: item.quantity.unit,
  planAlternativeIds: [...item.planAlternativeIds],
  noteAr: item.noteAr ?? null,
  noteEn: item.noteEn ?? null,
})

export const toLogEntry = (row: LogRow): LogEntry => ({
  id: row.id,
  date: localDate(row.date),
  slot: row.slot,
  foodId: row.foodId,
  quantity: quantity(row.amount, row.unit),
  planItemId: row.planItemId,
  loggedAt: row.loggedAt,
})

export const toLogRow = (entry: LogEntry): LogRow => ({
  id: entry.id,
  date: entry.date,
  slot: entry.slot,
  foodId: entry.foodId,
  amount: entry.quantity.amount,
  unit: entry.quantity.unit,
  planItemId: entry.planItemId,
  loggedAt: entry.loggedAt,
})

export const toSettings = (row: SettingsRow): Settings => ({
  locale: isLocale(row.locale) ? row.locale : 'ar',
  planStartDate: localDate(row.planStartDate),
  planLengthDays: row.planLengthDays,
})

export const toSettingsRow = (settings: Settings): SettingsRow => ({
  id: 'singleton',
  locale: settings.locale,
  planStartDate: settings.planStartDate,
  planLengthDays: settings.planLengthDays,
})
