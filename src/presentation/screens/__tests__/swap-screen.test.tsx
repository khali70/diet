import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { SwapScreen } from '../swap-screen'
import { makeFood } from '@/test/factories'
import { buildHarness, renderScreen } from '@/test/render'

const rice = { ...makeFood('rice', 'carb', 60), nameAr: 'أرز', nameEn: 'Rice' }
const potato = { ...makeFood('potato', 'carb', 260), nameAr: 'بطاطس', nameEn: 'Potato' }
const oats = { ...makeFood('oats', 'carb', 60), nameAr: 'شوفان', nameEn: 'Oats' }
const chicken = { ...makeFood('chicken', 'protein', 120), nameAr: 'دجاج', nameEn: 'Chicken' }
const oliveOil = {
  ...makeFood('olive-oil', 'fat', 3, { unit: 'tsp', subGroup: 'group-1' }),
  nameAr: 'زيت زيتون',
  nameEn: 'Olive oil',
}
const walnut = { ...makeFood('walnut', 'fat', 20, { subGroup: 'group-2' }), nameAr: 'عين جمل', nameEn: 'Walnuts' }
const almond = { ...makeFood('almond', 'fat', 20, { subGroup: 'group-1' }), nameAr: 'لوز', nameEn: 'Almonds' }
const ketchup = { ...makeFood('ketchup-light', 'other', null), nameAr: 'كاتشب لايت', nameEn: 'Light ketchup' }

const foods = [rice, potato, oats, chicken, oliveOil, walnut, almond, ketchup]

const renderAt = (route: string, language: 'ar' | 'en' = 'ar') =>
  renderScreen(
    <Routes>
      <Route path="/swap" element={<SwapScreen />} />
    </Routes>,
    buildHarness({ foods }),
    { route, language },
  )

describe('SwapScreen', () => {
  it('calculates the coach worked example when opened from a plan line', async () => {
    // 60 g rice and 260 g potato are one exchange each, so 100 g of rice is
    // 100 * 260 / 60, which the interface rounds to 433 g.
    renderAt('/swap?food=rice&amount=100')

    const results = await screen.findByRole('region', { name: 'تقدر تاكل بدالها' })
    expect(within(results).getByText('بطاطس')).toBeInTheDocument()
    expect(within(results).getByText('433 جم')).toBeInTheDocument()
  })

  it('calculates from the form when the user picks a food and an amount', async () => {
    const user = userEvent.setup()
    renderAt('/swap')

    await user.selectOptions(await screen.findByLabelText('الصنف'), 'rice')
    await user.type(screen.getByLabelText('الكمية'), '60')
    await user.click(screen.getByRole('button', { name: 'احسب' }))

    const results = await screen.findByRole('region', { name: 'تقدر تاكل بدالها' })
    expect(within(results).getByText('260 جم')).toBeInTheDocument()
  })

  it('never offers a food from another category', async () => {
    renderAt('/swap?food=rice&amount=100')

    const results = await screen.findByRole('region', { name: 'تقدر تاكل بدالها' })
    expect(within(results).getByText('بطاطس')).toBeInTheDocument()
    expect(within(results).queryByText('دجاج')).not.toBeInTheDocument()
    expect(within(results).queryByText('زيت زيتون')).not.toBeInTheDocument()
  })

  it('warns that a fat swap crosses sub groups', async () => {
    renderAt('/swap?food=almond&amount=20')

    expect(await screen.findByText(/من مجموعة دهون تانية/)).toBeInTheDocument()
  })

  it('shows an error instead of a result when the food has no exchange table', async () => {
    renderAt('/swap?food=ketchup-light&amount=20')

    expect(await screen.findByRole('alert')).toHaveTextContent('الصنف ده مالوش جدول بدائل')
  })

  it('tells the user which way round to weigh the food', async () => {
    const user = userEvent.setup()
    renderAt('/swap')

    await user.selectOptions(await screen.findByLabelText('الصنف'), 'chicken')
    expect(screen.getByText('الميزان بعد الطهي')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('الصنف'), 'rice')
    expect(screen.getByText('الميزان قبل الطهي')).toBeInTheDocument()
  })

  it('leaves foods with no exchange table out of the picker', async () => {
    renderAt('/swap')

    const picker = await screen.findByLabelText('الصنف')
    expect(picker).not.toHaveTextContent('كاتشب لايت')
  })

  it('renders in English when the interface language is English', async () => {
    renderAt('/swap?food=rice&amount=100', 'en')

    const results = await screen.findByRole('region', { name: 'You can eat instead' })
    expect(within(results).getByText('Potato')).toBeInTheDocument()
    expect(within(results).getByText('433 g')).toBeInTheDocument()
  })

  it('shows the spoon unit for oils rather than forcing grams', async () => {
    const user = userEvent.setup()
    renderAt('/swap')

    await user.selectOptions(await screen.findByLabelText('الصنف'), 'olive-oil')

    expect(screen.getByText('معلقة صغيرة')).toBeInTheDocument()
  })
})
