import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { App } from '../app'
import { buildHarness, renderScreen } from '@/test/render'

const harness = () => buildHarness({ foods: [] })

describe('App', () => {
  it('opens on the today screen', async () => {
    renderScreen(<App />, harness())

    expect(await screen.findByRole('heading', { name: 'أكل النهارده' })).toBeInTheDocument()
  })

  it('sends an unknown route back to today rather than showing nothing', async () => {
    renderScreen(<App />, harness(), { route: '/does-not-exist' })

    expect(await screen.findByRole('heading', { name: 'أكل النهارده' })).toBeInTheDocument()
  })

  it('renders the whole shell right to left in Arabic', async () => {
    renderScreen(<App />, harness())

    await screen.findByRole('navigation')
    expect(document.documentElement.dir).toBe('rtl')
  })

  it('navigates between screens', async () => {
    const user = userEvent.setup()
    renderScreen(<App />, harness())

    await user.click(await screen.findByRole('link', { name: 'الإرشادات' }))

    expect(await screen.findByRole('heading', { name: 'إرشادات الخطة' })).toBeInTheDocument()
  })

  it('gives every navigation entry a tap target of at least 44 px', async () => {
    renderScreen(<App />, harness())

    for (const link of await screen.findAllByRole('link')) {
      expect(link.className).toContain('min-h-[3.25rem]')
    }
  })
})
