import type { ExchangeError } from '@/domain/errors/exchange-error'
import type { Food } from '@/domain/model/food'
import type { Quantity } from '@/domain/model/quantity'
import type { FoodReader } from '@/domain/ports/food-repository'
import { convertExchange } from '@/domain/services/exchange-calculator'
import { err, ok, type Result } from '@/domain/shared/result'

export interface ExchangeOption {
  readonly food: Food
  readonly quantity: Quantity
  readonly discouraged: boolean
  /** True when the coach listed this alternative next to the plan line itself. */
  readonly fromPlan: boolean
}

export interface ListExchangesInput {
  readonly foodId: string
  readonly quantity: Quantity
  /** Alternatives the coach wrote for the specific plan line, ranked first. */
  readonly planAlternativeIds?: readonly string[]
}

export interface ListExchangesError {
  readonly code: 'UNKNOWN_FOOD' | ExchangeError['code']
  readonly detail: string
}

/**
 * Every food the given amount can be swapped for, with the amount to eat.
 *
 * Ordering: the coach's own alternatives for this plan line come first, then
 * same sub group foods, then the rest of the category.
 */
export class ListExchangesFor {
  constructor(private readonly foods: FoodReader) {}

  async execute(input: ListExchangesInput): Promise<Result<readonly ExchangeOption[], ListExchangesError>> {
    const source = await this.foods.byId(input.foodId)
    if (source === undefined) {
      return err({ code: 'UNKNOWN_FOOD', detail: `no food with id ${input.foodId}` })
    }

    const probe = convertExchange(source, input.quantity, source)
    if (!probe.ok) return err({ code: probe.error.code, detail: probe.error.detail })

    const planAlternatives = new Set(input.planAlternativeIds ?? [])
    const candidates = await this.foods.byCategory(source.category)

    const options = candidates.flatMap<ExchangeOption>((food) => {
      if (food.id === source.id) return []
      const converted = convertExchange(source, input.quantity, food)
      if (!converted.ok) return []
      return [
        {
          food,
          quantity: converted.value.quantity,
          discouraged: converted.value.discouraged,
          fromPlan: planAlternatives.has(food.id),
        },
      ]
    })

    return ok(options.sort(byRelevance(source.subGroup)))
  }
}

const byRelevance =
  (sourceSubGroup: string | undefined) =>
  (a: ExchangeOption, b: ExchangeOption): number => {
    if (a.fromPlan !== b.fromPlan) return a.fromPlan ? -1 : 1
    const aSame = a.food.subGroup === sourceSubGroup
    const bSame = b.food.subGroup === sourceSubGroup
    if (aSame !== bSame) return aSame ? -1 : 1
    return a.food.nameAr.localeCompare(b.food.nameAr, 'ar')
  }
