import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { PlanStatus } from '@/application/usecases/get-plan-status'
import type { Food } from '@/domain/model/food'
import type { LocalDate } from '@/domain/model/local-date'
import { quantity } from '@/domain/model/quantity'
import type { DayProgress, PlanItemProgress } from '@/domain/services/day-progress'
import { AmountInput } from '../components/amount-input'
import { ProgressBar } from '../components/progress-bar'
import { formatAmount, formatPercent, formatQuantity } from '../format'
import { useAsyncData } from '../hooks/use-async-data'
import { useFoodName } from '../hooks/use-food-name'
import { useUseCases } from '../hooks/use-cases'

interface Props {
  date: LocalDate
}

export const TodayScreen = ({ date }: Props) => {
  const { t } = useTranslation()
  const useCases = useUseCases()
  const nameOf = useFoodName()

  const { data, reload } = useAsyncData<{
    progress: DayProgress
    status: PlanStatus
    foods: ReadonlyMap<string, Food>
  }>(async () => {
    const [progress, status, allFoods] = await Promise.all([
      useCases.getDayProgress.execute(date),
      useCases.getPlanStatus.execute(),
      useCases.foods.all(),
    ])
    return { progress, status, foods: new Map(allFoods.map((food) => [food.id, food])) }
  }, [useCases, date])

  if (data === null) {
    return <p className="p-4 text-slate-400">{t('common.loading')}</p>
  }

  const { progress, status, foods } = data

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-100">{t('today.heading')}</h1>
        <p className="text-sm text-slate-400">
          {t('today.dayOfPlan', { day: status.dayNumber, total: status.totalDays })}
        </p>
        <ProgressBar ratio={progress.completion} label={t('today.heading')} />
        <p className="text-xs text-slate-500">{formatPercent(progress.completion)}</p>
        {status.cheatMealUnlocked ? (
          <p className="rounded-lg bg-amber-950 p-3 text-sm text-amber-200">{t('today.cheatMealUnlocked')}</p>
        ) : (
          <p className="text-xs text-slate-500">{t('today.daysRemaining', { count: status.daysRemaining })}</p>
        )}
      </header>

      {progress.slots.map((slot) => (
        <section key={slot.slot} className="rounded-2xl bg-slate-900 p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-medium text-slate-100">{t(`slots.${slot.slot}`)}</h2>
            <span className="text-xs text-slate-500">{formatPercent(slot.completion)}</span>
          </div>

          {slot.items.length === 0 ? (
            <p className="text-sm text-slate-500">{t('today.emptySlot')}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {slot.items.map((item) => (
                <PlanItemRow
                  key={item.planItem.id}
                  date={date}
                  item={item}
                  name={nameOf(item.food)}
                  onChanged={reload}
                />
              ))}
            </ul>
          )}

          {slot.extras.length > 0 && (
            <div className="mt-4 border-t border-slate-800 pt-3">
              <h3 className="mb-2 text-sm text-slate-400">{t('today.extras')}</h3>
              <ul className="flex flex-col gap-1">
                {slot.extras.map((extra) => (
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
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

const PlanItemRow = ({
  date,
  item,
  name,
  onChanged,
}: {
  date: LocalDate
  item: PlanItemProgress
  name: string
  onChanged: () => Promise<void>
}) => {
  const { t } = useTranslation()
  const useCases = useUseCases()
  const [amount, setAmount] = useState('')
  const [open, setOpen] = useState(false)

  const logAmount = async (value: number) => {
    await useCases.logMealEntry.execute({
      date,
      slot: item.planItem.slot,
      foodId: item.planItem.foodId,
      quantity: quantity(value, item.planItem.quantity.unit),
      planItemId: item.planItem.id,
    })
    setAmount('')
    setOpen(false)
    await onChanged()
  }

  const done = item.remaining.amount <= 0.0001
  const over = item.remaining.amount < -0.0001

  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-slate-100">{name}</span>
        <span className="shrink-0 text-sm text-slate-400">{formatQuantity(item.planned, t)}</span>
      </div>

      <ProgressBar ratio={item.completion} label={name} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>
          {t('today.consumed')}: {formatAmount(item.consumed)}
        </span>
        {over ? (
          <span className="text-amber-400">
            {t('today.over', { amount: formatAmount({ ...item.remaining, amount: -item.remaining.amount }) })}
          </span>
        ) : done ? (
          <span className="text-emerald-400">{t('today.done')}</span>
        ) : (
          <span>
            {t('today.remaining')}: {formatQuantity(item.remaining, t)}
          </span>
        )}
      </div>

      {item.unconvertible.length > 0 && (
        <p className="text-xs text-amber-400">{t('today.unconvertible')}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void logAmount(item.remaining.amount > 0 ? item.remaining.amount : item.planned.amount)}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
        >
          {t('today.logFull')}
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
        >
          {t('today.logPartial')}
        </button>
        <Link
          to={`/swap?food=${item.planItem.foodId}&amount=${item.planned.amount}&planItem=${item.planItem.id}`}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
        >
          {t('today.swap')}
        </Link>
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
            unit={item.planned.unit}
            onChange={setAmount}
            autoFocus
          />
          <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">
            {t('common.add')}
          </button>
        </form>
      )}

      {item.entries.length > 0 && (
        <ul className="flex flex-col gap-1">
          {item.entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between text-xs text-slate-500">
              <span>{formatQuantity(entry.quantity, t)}</span>
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
