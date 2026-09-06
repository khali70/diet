import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { ReferenceScreen } from '../reference-screen'
import { buildHarness, renderScreen } from '@/test/render'

const harness = () => buildHarness({ foods: [] })

describe('ReferenceScreen', () => {
  it('shows the whole day figures exactly as the plan prints them', () => {
    renderScreen(<ReferenceScreen />, harness())

    expect(screen.getByText('2705.41')).toBeInTheDocument()
    expect(screen.getByText('145.05')).toBeInTheDocument()
    expect(screen.getByText('416.34')).toBeInTheDocument()
    expect(screen.getByText('54.69')).toBeInTheDocument()
  })

  it('explains that the app tracks portions rather than calories', () => {
    renderScreen(<ReferenceScreen />, harness())

    expect(screen.getByText(/مفيش سعرات لكل صنف/)).toBeInTheDocument()
  })

  it('shows the coach rules in Arabic', () => {
    renderScreen(<ReferenceScreen />, harness())

    expect(screen.getByRole('heading', { name: 'وزن الطعام' })).toBeInTheDocument()
    expect(screen.getByText(/قبل الطهي/)).toBeInTheDocument()
  })

  it('shows the same rules in English when the interface is English', () => {
    renderScreen(<ReferenceScreen />, harness(), { language: 'en' })

    expect(screen.getByRole('heading', { name: 'Weighing food' })).toBeInTheDocument()
    expect(screen.getByText(/After cooking: all protein/)).toBeInTheDocument()
  })
})
