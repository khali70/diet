import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { SettingsScreen } from '../settings-screen'
import { localDate } from '@/domain/model/local-date'
import { quantity } from '@/domain/model/quantity'
import { makeFood } from '@/test/factories'
import { buildHarness, renderScreen } from '@/test/render'

const rice = { ...makeFood('rice', 'carb', 60), nameAr: 'أرز', nameEn: 'Rice' }

const harnessWithOneLog = () =>
  buildHarness({
    foods: [rice],
    logs: [
      {
        id: 'a',
        date: localDate('2026-09-06'),
        slot: 'lunch',
        foodId: 'rice',
        quantity: quantity(150, 'g'),
        planItemId: null,
        loggedAt: '2026-09-06T13:00:00.000Z',
      },
    ],
  })

describe('SettingsScreen', () => {
  it('shows the stored language as the pressed option', async () => {
    renderScreen(<SettingsScreen />, buildHarness({ foods: [rice] }))

    expect(await screen.findByRole('button', { name: 'العربية' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches the interface to English and back', async () => {
    const user = userEvent.setup()
    renderScreen(<SettingsScreen />, buildHarness({ foods: [rice] }))

    await user.click(await screen.findByRole('button', { name: 'English' }))

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'العربية' }))
    expect(await screen.findByRole('heading', { name: 'الإعدادات' })).toBeInTheDocument()
  })

  it('saves the language choice so it survives a reload', async () => {
    const user = userEvent.setup()
    const harness = buildHarness({ foods: [rice] })
    renderScreen(<SettingsScreen />, harness)

    await user.click(await screen.findByRole('button', { name: 'English' }))

    await expect(harness.useCases.settings.get()).resolves.toMatchObject({ locale: 'en' })
  })

  it('shows the plan start date and length', async () => {
    renderScreen(<SettingsScreen />, buildHarness({ foods: [rice] }))

    expect(await screen.findByLabelText('بداية الخطة')).toHaveValue('2026-09-06')
    expect(screen.getByLabelText('مدة الخطة بالأيام')).toHaveValue(15)
  })

  it('warns that the data lives only in this browser', async () => {
    renderScreen(<SettingsScreen />, buildHarness({ foods: [rice] }))

    expect(await screen.findByText(/محفوظة في المتصفح بس/)).toBeInTheDocument()
  })

  it('asks for confirmation before deleting every log', async () => {
    const user = userEvent.setup()
    const harness = harnessWithOneLog()
    renderScreen(<SettingsScreen />, harness)

    await user.click(await screen.findByRole('button', { name: 'مسح كل التسجيلات' }))

    expect(screen.getByText(/هتمسح كل التسجيلات نهائي/)).toBeInTheDocument()
    await expect(harness.logs.all()).resolves.toHaveLength(1)
  })

  it('keeps the logs when the confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const harness = harnessWithOneLog()
    renderScreen(<SettingsScreen />, harness)

    await user.click(await screen.findByRole('button', { name: 'مسح كل التسجيلات' }))
    await user.click(screen.getByRole('button', { name: 'إلغاء' }))

    await expect(harness.logs.all()).resolves.toHaveLength(1)
  })

  it('deletes the logs once the deletion is confirmed', async () => {
    const user = userEvent.setup()
    const harness = harnessWithOneLog()
    renderScreen(<SettingsScreen />, harness)

    await user.click(await screen.findByRole('button', { name: 'مسح كل التسجيلات' }))
    await user.click(screen.getByRole('button', { name: 'تأكيد' }))

    expect(await screen.findByText('تم مسح التسجيلات')).toBeInTheDocument()
    await expect(harness.logs.all()).resolves.toHaveLength(0)
  })
})
