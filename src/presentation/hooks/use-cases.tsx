import { createContext, use, type ReactNode } from 'react'
import type { UseCases } from '@/composition/container'

const UseCasesContext = createContext<UseCases | null>(null)

/**
 * Hands the wired use cases to the tree. Components never construct a
 * repository, so every screen can be tested against fakes.
 */
export const UseCasesProvider = ({ value, children }: { value: UseCases; children: ReactNode }) => (
  <UseCasesContext value={value}>{children}</UseCasesContext>
)

export const useUseCases = (): UseCases => {
  const value = use(UseCasesContext)
  if (value === null) throw new Error('useUseCases must be used inside a UseCasesProvider')
  return value
}
