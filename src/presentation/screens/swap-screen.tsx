import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import type { ExchangeOption } from '@/application/usecases/list-exchanges-for'
import type { Food } from '@/domain/model/food'
import { quantity } from '@/domain/model/quantity'
import { PLAN_ALTERNATIVE_AMOUNTS } from '@/infrastructure/seed/plan'
import { AmountInput } from '../components/amount-input'
import { formatQuantity } from '../format'
import { useAsyncData } from '../hooks/use-async-data'
import { useFoodName } from '../hooks/use-food-name'
import { useUseCases } from '../hooks/use-cases'

interface Query {
  foodId: string
  amount: number
}

type Outcome = { kind: 'options'; options: readonly ExchangeOption[] } | { kind: 'error'; code: string }

/**
 * The exchange calculator. It opens pre-filled from a plan line, and works
 * standalone for anything else the user wants to convert.
 */
export const SwapScreen = () => {
  const { t } = useTranslation()
  const useCases = useUseCases()
  const nameOf = useFoodName()
  const [params] = useSearchParams()

  const planItemId = params.get('planItem')
  const coachAmounts = planItemId === null ? undefined : PLAN_ALTERNATIVE_AMOUNTS[planItemId]

  const { data: foods } = useAsyncData<readonly Food[]>(() => useCases.foods.all(), [useCases])

  const [foodId, setFoodId] = useState(params.get('food') ?? '')
  const [amount, setAmount] = useState(params.get('amount') ?? '')
  const [query, setQuery] = useState<Query | null>(initialQuery(params.get('food'), params.get('amount')))

  const selected = foods?.find((food) => food.id === foodId)
  const unit = selected?.reference?.unit ?? 'g'

  const { data: outcome } = useAsyncData<Outcome | null>(async () => {
    if (query === null || foods === null) return null

    const source = foods.find((food) => food.id === query.foodId)
    const result = await useCases.listExchangesFor.execute({
      foodId: query.foodId,
      quantity: quantity(query.amount, source?.reference?.unit ?? 'g'),
      planAlternativeIds: coachAmounts === undefined ? [] : Object.keys(coachAmounts),
    })

    return result.ok ? { kind: 'options', options: result.value } : { kind: 'error', code: result.error.code }
  }, [query, foods, useCases, coachAmounts])

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold text-slate-100">{t('swap.heading')}</h1>

      <form
        className="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4"
        onSubmit={(event) => {
          event.preventDefault()
          const value = Number(amount)
          if (foodId !== '' && Number.isFinite(value) && value > 0) setQuery({ foodId, amount: value })
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">{t('swap.sourceLabel')}</span>
          <select
            value={foodId}
            onChange={(event) => setFoodId(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="">-</option>
            {(foods ?? [])
              .filter((food) => food.category !== 'other')
              .map((food) => (
                <option key={food.id} value={food.id}>
                  {nameOf(food)}
                </option>
              ))}
          </select>
        </label>

        <AmountInput label={t('swap.amountLabel')} value={amount} unit={unit} onChange={setAmount} />

        {selected !== undefined && (
          <p className="text-xs text-slate-500">
            {selected.category === 'protein' ? t('swap.weighAfter') : t('swap.weighBefore')}
          </p>
        )}

        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white">
          {t('swap.calculate')}
        </button>
      </form>

      {outcome?.kind === 'error' && (
        <p role="alert" className="rounded-lg bg-red-950 p-3 text-sm text-red-200">
          {t(`errors.${outcome.code}`, { defaultValue: t('errors.generic') })}
        </p>
      )}

      {outcome?.kind === 'options' && (
        <section aria-label={t('swap.results')} className="rounded-2xl bg-slate-900 p-4">
          <h2 className="mb-3 text-lg font-medium text-slate-100">{t('swap.results')}</h2>
          {outcome.options.length === 0 ? (
            <p className="text-sm text-slate-500">{t('swap.empty')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-800">
              {outcome.options.map((option) => {
                const coachAmount = coachAmounts?.[option.food.id]
                return (
                  <li key={option.food.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-slate-100">{nameOf(option.food)}</span>
                      <span className="shrink-0 font-medium text-emerald-400">
                        {formatQuantity(option.quantity, t)}
                      </span>
                    </div>
                    {option.fromPlan && <span className="text-xs text-emerald-500">{t('swap.fromPlan')}</span>}
                    {coachAmount !== undefined && (
                      <span className="text-xs text-slate-400">
                        {t('swap.coachAmount', {
                          amount: formatQuantity(quantity(coachAmount, option.quantity.unit), t),
                        })}
                      </span>
                    )}
                    {option.discouraged && <span className="text-xs text-amber-400">{t('swap.discouraged')}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

const initialQuery = (food: string | null, amount: string | null): Query | null => {
  if (food === null || amount === null) return null
  const value = Number(amount)
  return Number.isFinite(value) && value > 0 ? { foodId: food, amount: value } : null
}
