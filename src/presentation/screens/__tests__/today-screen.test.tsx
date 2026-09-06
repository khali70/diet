import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { TodayScreen } from '../today-screen'
import { localDate } from '@/domain/model/local-date'
import type { PlanItem } from '@/domain/model/plan-item'
import { quantity } from '@/domain/model/quantity'
import { makeFood } from '@/test/factories'
import { buildHarness, renderScreen } from '@/test/render'

const DATE = localDate('2026-09-06')

const rice = { ...makeFood('rice', 'carb', 60), nameAr: 'أرز', nameEn: 'Rice' }
const potato = { ...makeFood('potato', 'carb', 260), nameAr: 'بطاطس', nameEn: 'Potato' }

const riceLine: PlanItem = {
  id: 'lunch-rice',
  slot: 'lunch',
  order: 0,
  foodId: 'rice',
  quantity: quantity(150, 'g'),
  planAlternativeIds: [],
}

const harnessWith = (logs: Parameters<typeof buildHarness>[0]['logs'] = []) =>
  buildHarness({ foods: [rice, potato], plan: [riceLine], logs })

describe('TodayScreen', () => {
  it('shows the planned food with its Arabic name and amount', async () => {
    renderScreen(<TodayScreen date={DATE} />, harnessWith())

    expect(await screen.findByText('أرز')).toBeInTheDocument()
    expect(screen.getByText('150 جم')).toBeInTheDocument()
  })

  it('shows the English name when the interface is in English', async () => {
    renderScreen(<TodayScreen date={DATE} />, harnessWith(), { language: 'en' })

    expect(await screen.findByText('Rice')).toBeInTheDocument()
    expect(screen.getByText('150 g')).toBeInTheDocument()
  })

  it('shows the full amount as remaining before anything is logged', async () => {
    renderScreen(<TodayScreen date={DATE} />, harnessWith())

    expect(await screen.findByText(/الباقي: 150 جم/)).toBeInTheDocument()
  })

  it('logs the full portion and updates what the user sees', async () => {
    const user = userEvent.setup()
    const harness = harnessWith()
    renderScreen(<TodayScreen date={DATE} />, harness)

    await user.click(await screen.findByRole('button', { name: 'سجل الكمية كاملة' }))

    expect(await screen.findByText('تمام')).toBeInTheDocument()
    await expect(harness.logs.all()).resolves.toHaveLength(1)
  })

  it('logs a partial amount typed by the user', async () => {
    const user = userEvent.setup()
    const harness = harnessWith()
    renderScreen(<TodayScreen date={DATE} />, harness)

    await user.click(await screen.findByRole('button', { name: 'سجل كمية' }))
    await user.type(screen.getByLabelText('سجل كمية'), '50')
    await user.click(screen.getByRole('button', { name: 'إضافة' }))

    expect(await screen.findByText(/الباقي: 100 جم/)).toBeInTheDocument()
  })

  it('counts a logged substitute against the planned line', async () => {
    // 150 g of planned rice is 150 * 260 / 60 = 650 g of potato.
    renderScreen(
      <TodayScreen date={DATE} />,
      harnessWith([
        {
          id: 'a',
          date: DATE,
          slot: 'lunch',
          foodId: 'potato',
          quantity: quantity(650, 'g'),
          planItemId: 'lunch-rice',
          loggedAt: '2026-09-06T13:00:00.000Z',
        },
      ]),
    )

    expect(await screen.findByText('تمام')).toBeInTheDocument()
  })

  it('shows an overshoot rather than hiding it', async () => {
    renderScreen(
      <TodayScreen date={DATE} />,
      harnessWith([
        {
          id: 'a',
          date: DATE,
          slot: 'lunch',
          foodId: 'rice',
          quantity: quantity(200, 'g'),
          planItemId: 'lunch-rice',
          loggedAt: '2026-09-06T13:00:00.000Z',
        },
      ]),
    )

    expect(await screen.findByText('زيادة 50')).toBeInTheDocument()
  })

  it('undoes a logged entry', async () => {
    const user = userEvent.setup()
    const harness = harnessWith()
    renderScreen(<TodayScreen date={DATE} />, harness)

    await user.click(await screen.findByRole('button', { name: 'سجل الكمية كاملة' }))
    await user.click(await screen.findByRole('button', { name: 'تراجع' }))

    await waitFor(async () => {
      await expect(harness.logs.all()).resolves.toHaveLength(0)
    })
    expect(await screen.findByText(/الباقي: 150 جم/)).toBeInTheDocument()
  })

  it('shows the day of the plan', async () => {
    renderScreen(<TodayScreen date={DATE} />, harnessWith())

    expect(await screen.findByText('اليوم 1 من 15')).toBeInTheDocument()
  })

  it('says a meal is empty rather than rendering a blank card', async () => {
    renderScreen(<TodayScreen date={DATE} />, harnessWith())

    expect(await screen.findAllByText('مفيش أصناف في الوجبة دي')).not.toHaveLength(0)
  })

  it('links each line to the swap calculator with its food and amount', async () => {
    renderScreen(<TodayScreen date={DATE} />, harnessWith())

    const link = await screen.findByRole('link', { name: 'بدل' })
    expect(link).toHaveAttribute('href', '/swap?food=rice&amount=150&planItem=lunch-rice')
  })

  it('shows a warning when a logged food cannot count towards the line', async () => {
    renderScreen(
      <TodayScreen date={DATE} />,
      buildHarness({
        foods: [rice, makeFood('chicken', 'protein', 120)],
        plan: [riceLine],
        logs: [
          {
            id: 'a',
            date: DATE,
            slot: 'lunch',
            foodId: 'chicken',
            quantity: quantity(100, 'g'),
            planItemId: 'lunch-rice',
            loggedAt: '2026-09-06T13:00:00.000Z',
          },
        ],
      }),
    )

    expect(await screen.findByText(/مش من نفس المجموعة/)).toBeInTheDocument()
  })
})
