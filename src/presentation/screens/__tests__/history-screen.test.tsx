import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { HistoryScreen } from '../history-screen'
import { localDate } from '@/domain/model/local-date'
import type { PlanItem } from '@/domain/model/plan-item'
import { quantity } from '@/domain/model/quantity'
import { makeFood } from '@/test/factories'
import { buildHarness, renderScreen } from '@/test/render'

const TODAY = localDate('2026-09-06')
const rice = { ...makeFood('rice', 'carb', 60), nameAr: 'أرز', nameEn: 'Rice' }

const riceLine: PlanItem = {
  id: 'lunch-rice',
  slot: 'lunch',
  order: 0,
  foodId: 'rice',
  quantity: quantity(150, 'g'),
  planAlternativeIds: [],
}

describe('HistoryScreen', () => {
  it('shows a designed empty state rather than a blank page', async () => {
    renderScreen(<HistoryScreen today={TODAY} />, buildHarness({ foods: [rice], plan: [riceLine] }))

    expect(await screen.findByText('لسه مفيش أيام مسجلة')).toBeInTheDocument()
  })

  it('lists a day that has logs, with its adherence', async () => {
    renderScreen(
      <HistoryScreen today={TODAY} />,
      buildHarness({
        foods: [rice],
        plan: [riceLine],
        logs: [
          {
            id: 'a',
            date: TODAY,
            slot: 'lunch',
            foodId: 'rice',
            quantity: quantity(150, 'g'),
            planItemId: 'lunch-rice',
            loggedAt: '2026-09-06T13:00:00.000Z',
          },
        ],
      }),
    )

    expect(await screen.findByText('2026-09-06')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('leaves out days with nothing logged', async () => {
    renderScreen(
      <HistoryScreen today={TODAY} />,
      buildHarness({
        foods: [rice],
        plan: [riceLine],
        logs: [
          {
            id: 'a',
            date: localDate('2026-09-05'),
            slot: 'lunch',
            foodId: 'rice',
            quantity: quantity(75, 'g'),
            planItemId: 'lunch-rice',
            loggedAt: '2026-09-05T13:00:00.000Z',
          },
        ],
      }),
    )

    expect(await screen.findByText('2026-09-05')).toBeInTheDocument()
    expect(screen.queryByText('2026-09-06')).not.toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
