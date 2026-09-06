import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, waitFor, within } from '@testing-library/react'
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

const breakfastRiceLine: PlanItem = {
  id: 'breakfast-rice',
  slot: 'breakfast',
  order: 0,
  foodId: 'rice',
  quantity: quantity(60, 'g'),
  planAlternativeIds: [],
}

const harnessWith = (logs: Parameters<typeof buildHarness>[0]['logs'] = []) =>
  buildHarness({ foods: [rice, potato], plan: [riceLine], logs })

describe('TodayScreen', () => {
  it('shows the planned food with its Arabic name and amount', async () => {
    renderScreen(<TodayScreen date={DATE} />, harnessWith())

    expect(await screen.findByText('أرز')).toBeInTheDocument()
    expect(screen.getByText(/من 150 جم/)).toBeInTheDocument()
  })

  it('shows the English name when the interface is in English', async () => {
    renderScreen(<TodayScreen date={DATE} />, harnessWith(), { language: 'en' })

    expect(await screen.findByText('Rice')).toBeInTheDocument()
    expect(screen.getByText(/of 150 g/)).toBeInTheDocument()
  })

  it('shows the full amount as remaining before anything is logged', async () => {
    renderScreen(<TodayScreen date={DATE} />, harnessWith())

    expect(await screen.findByText(/الباقي: 150 جم/)).toBeInTheDocument()
  })

  it('logs everything that is left and updates what the user sees', async () => {
    const user = userEvent.setup()
    const harness = harnessWith()
    renderScreen(<TodayScreen date={DATE} />, harness)

    await user.click(await screen.findByRole('button', { name: 'سجل الباقي' }))

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

    await user.click(await screen.findByRole('button', { name: 'سجل الباقي' }))
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

  it('says the day is empty rather than rendering blank sections', async () => {
    renderScreen(<TodayScreen date={DATE} />, buildHarness({ foods: [rice], plan: [], logs: [] }))

    expect(await screen.findByText('مفيش أصناف متسجلة لليوم ده')).toBeInTheDocument()
  })

  it('merges the same food across meals into one row for the day', async () => {
    renderScreen(
      <TodayScreen date={DATE} />,
      buildHarness({ foods: [rice, potato], plan: [breakfastRiceLine, riceLine], logs: [] }),
    )

    expect(await screen.findAllByText('أرز')).toHaveLength(1)
    expect(screen.getByText(/الباقي: 210 جم/)).toBeInTheDocument()
    expect(screen.getByText('الفطار')).toBeInTheDocument()
    expect(screen.getByText('الغدا')).toBeInTheDocument()
  })

  it('spreads one logged amount across the meals it belongs to', async () => {
    const user = userEvent.setup()
    const harness = buildHarness({ foods: [rice, potato], plan: [breakfastRiceLine, riceLine], logs: [] })
    renderScreen(<TodayScreen date={DATE} />, harness)

    await user.click(await screen.findByRole('button', { name: 'سجل كمية' }))
    await user.type(screen.getByLabelText('سجل كمية'), '100')
    await user.click(screen.getByRole('button', { name: 'إضافة' }))

    expect(await screen.findByText(/الباقي: 110 جم/)).toBeInTheDocument()
    const logs = await harness.logs.all()
    expect(logs.map((entry) => [entry.slot, entry.quantity.amount])).toEqual([
      ['breakfast', 60],
      ['lunch', 40],
    ])
  })

  it('separates the food that is finished from the food that is left', async () => {
    renderScreen(
      <TodayScreen date={DATE} />,
      buildHarness({
        foods: [rice, potato],
        plan: [breakfastRiceLine, { ...riceLine, foodId: 'potato', id: 'lunch-potato' }],
        logs: [
          {
            id: 'a',
            date: DATE,
            slot: 'breakfast',
            foodId: 'rice',
            quantity: quantity(60, 'g'),
            planItemId: 'breakfast-rice',
            loggedAt: '2026-09-06T08:00:00.000Z',
          },
        ],
      }),
    )

    const finished = await screen.findByRole('region', { name: 'خلص' })
    expect(within(finished).getByText('أرز')).toBeInTheDocument()
    const left = screen.getByRole('region', { name: 'لسه عليك' })
    expect(within(left).getByText('بطاطس')).toBeInTheDocument()
  })

  it('links each food to the swap calculator with its whole day amount', async () => {
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
