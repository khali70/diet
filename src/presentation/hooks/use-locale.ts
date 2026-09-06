import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Locale } from '@/domain/model/settings'
import { applyDocumentLocale } from '../i18n'
import { useUseCases } from './use-cases'

/** Reads the stored language, applies it to the document, and saves changes. */
export const useLocale = (): { locale: Locale; setLocale: (next: Locale) => Promise<void> } => {
  const { i18n } = useTranslation()
  const { settings, updateSettings } = useUseCases()
  const [locale, setStoredLocale] = useState<Locale>((i18n.language as Locale) ?? 'ar')

  useEffect(() => {
    let cancelled = false
    void settings.get().then((stored) => {
      if (cancelled) return
      setStoredLocale(stored.locale)
      void i18n.changeLanguage(stored.locale)
      applyDocumentLocale(stored.locale)
    })
    return () => {
      cancelled = true
    }
  }, [settings, i18n])

  const setLocale = useCallback(
    async (next: Locale) => {
      await updateSettings.execute({ locale: next })
      setStoredLocale(next)
      await i18n.changeLanguage(next)
      applyDocumentLocale(next)
    },
    [updateSettings, i18n],
  )

  return { locale, setLocale }
}
