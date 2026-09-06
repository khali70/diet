import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { PlanStatus } from '@/application/usecases/get-plan-status'
import type { Food } from '@/domain/model/food'
import type { PortionHint } from '@/domain/model/portion-hint'
import type { LocalDate } from '@/domain/model/local-date'
import { quantity } from '@/domain/model/quantity'
import { allocateToPool, type DayPool, type PooledFood } from '@/domain/services/day-pool'
import { AmountInput } from '../components/amount-input'
import { ProgressBar } from '../components/progress-bar'
import { formatAmount, formatPercent, formatQuantity } from '../format'
import { useAsyncData } from '../hooks/use-async-data'
import { useFoodName } from '../hooks/use-food-name'
import { useUseCases } from '../hooks/use-cases'

interface Props {
  date: LocalDate
}

/**
 * The day as one bulk of food. The coach splits the plan across six meals, but
 * the same food often appears in more than one, and the user eats when they eat.
 * So the screen shows one row per food with what is left of it, and every meal
 * it belongs to as a hint rather than as a separator.
 */
export const TodayScreen = ({ date }: Props) => {
  const { t } = useTranslation()
  const useCases = useUseCases()
  const nameOf = useFoodName()

  const { data, reload } = useAsyncData<{
    pool: DayPool
    status: PlanStatus
    foods: ReadonlyMap<string, Food>
    hints: ReadonlyMap<string, readonly PortionHint[]>
  }>(async () => {
    const [pool, status, allFoods, hints] = await Promise.all([
      useCases.getDayPool.execute(date),
      useCases.getPlanStatus.execute(),
      useCases.foods.all(),
      useCases.listPortionHints.execute(),
    ])
    return { pool, status, foods: new Map(allFoods.map((food) => [food.id, food])), hints }
  }, [useCases, date])

  if (data === null) {
    return <p className="p-4 text-slate-400">{t('common.loading')}</p>
  }

  const { pool, status, foods, hints } = data
  const left = pool.foods.filter((food) => !isDone(food))
  const finished = pool.foods.filter(isDone)

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-100">{t('today.poolHeading')}</h1>
        <p className="text-sm text-slate-400">
          {t('today.dayOfPlan', { day: status.dayNumber, total: status.totalDays })}
        </p>
        <ProgressBar ratio={pool.completion} label={t('today.poolHeading')} />
        <p className="text-xs text-slate-500">
          {formatPercent(pool.completion)} ·{' '}
          {t('today.itemsDone', { done: finished.length, total: pool.foods.length })}
        </p>
        {status.cheatMealUnlocked ? (
          <p className="rounded-lg bg-amber-950 p-3 text-sm text-amber-200">{t('today.cheatMealUnlocked')}</p>
        ) : (
          <p className="text-xs text-slate-500">{t('today.daysRemaining', { count: status.daysRemaining })}</p>
        )}
      </header>

      {pool.foods.length === 0 && <p className="text-sm text-slate-500">{t('today.nothingPlanned')}</p>}

      {left.length > 0 && (
        <section aria-label={t('today.left')} className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-slate-100">{t('today.left')}</h2>
          <ul className="flex flex-col gap-3">
            {left.map((food) => (
              <PooledFoodRow
                key={food.key}
                date={date}
                food={food}
                name={nameOf(food.food)}
                hints={hints.get(food.foodId) ?? []}
                onChanged={reload}
              />
            ))}
          </ul>
        </section>
      )}

      {left.length === 0 && pool.foods.length > 0 && (
        <p className="rounded-2xl bg-emerald-950 p-4 text-sm text-emerald-200">{t('today.allDone')}</p>
      )}

      {finished.length > 0 && (
        <section aria-label={t('today.finished')} className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-slate-400">{t('today.finished')}</h2>
          <ul className="flex flex-col gap-3">
            {finished.map((food) => (
              <PooledFoodRow
                key={food.key}
                date={date}
                food={food}
                name={nameOf(food.food)}
                hints={hints.get(food.foodId) ?? []}
                onChanged={reload}
              />
            ))}
          </ul>
        </section>
      )}

      {pool.extras.length > 0 && (
        <section aria-label={t('today.extras')} className="flex flex-col gap-2">
          <h2 className="text-sm text-slate-400">{t('today.extras')}</h2>
          <ul className="flex flex-col gap-1">
            {pool.extras.map((extra) => (
              <li key={extra.id} className="flex items-center justify-between text-sm text-slate-300">
                <span>
                  {nameOf(foods.get(extra.foodId))} {formatQuantity(extra.quantity, t)}
                </span>
                <button
                  type="button"
                  className="text-xs text-slate-500 underline"
                  onClick={async () => {
                    await useCases.removeMealEntry.execute(extra.id)
                    await reload()
                  }}
                >
                  {t('today.undo')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

const isDone = (food: PooledFood): boolean => food.remaining.amount <= 0.0001

const PooledFoodRow = ({
  date,
  food,
  name,
  hints,
  onChanged,
}: {
  date: LocalDate
  food: PooledFood
  name: string
  hints: readonly PortionHint[]
  onChanged: () => Promise<void>
}) => {
  const { t } = useTranslation()
  const useCases = useUseCases()
  const [amount, setAmount] = useState('')
  const [open, setOpen] = useState(false)

  /**
   * One amount can span several planned lines, for example rice at breakfast
   * and again at lunch. The domain decides how it is split; the screen only
   * writes what it is told.
   */
  const logAmount = async (value: number) => {
    for (const allocation of allocateToPool(food, quantity(value, food.planned.unit))) {
      await useCases.logMealEntry.execute({
        date,
        slot: allocation.slot,
        foodId: food.foodId,
        quantity: allocation.quantity,
        planItemId: allocation.planItemId,
      })
    }
    setAmount('')
    setOpen(false)
    await onChanged()
  }

  // A hint in another unit is useless here: spoons cannot fill a gram field.
  const sizeHints = hints.filter((hint) => hint.quantity.unit === food.planned.unit)
  const done = isDone(food)
  const over = food.remaining.amount < -0.0001
  const firstLine = food.lines[0]

  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-slate-900 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-slate-100">{name}</span>
        <span className="shrink-0 text-sm text-slate-400">
          {over ? (
            <span className="text-amber-400">
              {t('today.over', { amount: formatAmount({ ...food.remaining, amount: -food.remaining.amount }) })}
            </span>
          ) : done ? (
            <span className="text-emerald-400">{t('today.done')}</span>
          ) : (
            <>
              {t('today.remaining')}: {formatQuantity(food.remaining, t)}
            </>
          )}
        </span>
      </div>

      <ProgressBar ratio={food.completion} label={name} />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <span>
          {t('today.consumed')}: {formatAmount(food.consumed)} {t('today.ofPlanned', { amount: formatQuantity(food.planned, t) })}
        </span>
        <span aria-label={t('today.mealsLabel')} className="flex flex-wrap gap-1">
          {food.slots.map((slot) => (
            <span key={slot} className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">
              {t(`slots.${slot}`)}
            </span>
          ))}
        </span>
      </div>

      {food.unconvertible.length > 0 && <p className="text-xs text-amber-400">{t('today.unconvertible')}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void logAmount(done ? food.planned.amount : food.remaining.amount)}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
        >
          {done ? t('today.logFull') : t('today.logRest')}
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
        >
          {t('today.logPartial')}
        </button>
        {firstLine !== undefined && (
          <Link
            to={`/swap?food=${food.foodId}&amount=${food.planned.amount}&planItem=${firstLine.planItem.id}`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
          >
            {t('today.swap')}
          </Link>
        )}
      </div>

      {open && (
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const value = Number(amount)
            if (Number.isFinite(value) && value > 0) void logAmount(value)
          }}
        >
          <AmountInput
            label={t('today.logPartial')}
            value={amount}
            unit={food.planned.unit}
            onChange={setAmount}
            autoFocus
          />
          <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">
            {t('common.add')}
          </button>
        </form>
      )}

      {open && sizeHints.length > 0 && (
        <div aria-label={t('today.sizeGuide')} className="flex flex-wrap gap-2">
          {sizeHints.map((hint) => (
            <SizeHintChip key={`${hint.labelEn}-${hint.quantity.amount}`} hint={hint} onPick={setAmount} />
          ))}
        </div>
      )}

      {food.entries.length > 0 && (
        <ul className="flex flex-col gap-1">
          {food.entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {formatQuantity(entry.quantity, t)} · {t(`slots.${entry.slot}`)}
              </span>
              <button
                type="button"
                className="underline"
                onClick={async () => {
                  await useCases.removeMealEntry.execute(entry.id)
                  await onChanged()
                }}
              >
                {t('today.undo')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * A tap target for people eating away from a scale. It fills the amount field
 * rather than logging on its own, so an estimate can still be corrected before
 * it is recorded.
 */
const SizeHintChip = ({ hint, onPick }: { hint: PortionHint; onPick: (amount: string) => void }) => {
  const { t, i18n } = useTranslation()
  const label = i18n.language === 'en' ? hint.labelEn : hint.labelAr

  return (
    <button
      type="button"
      onClick={() => onPick(String(hint.quantity.amount))}
      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
    >
      {label} · {formatQuantity(hint.quantity, t)}
      {hint.source === 'estimate' && <span className="text-slate-500"> ({t('today.approximate')})</span>}
    </button>
  )
}
