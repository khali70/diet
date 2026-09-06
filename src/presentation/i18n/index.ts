import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Locale } from '@/domain/model/settings'
import { ar } from './locales/ar'
import { en } from './locales/en'

export const resources = {
  ar: { translation: ar },
  en: { translation: en },
} as const

/** Arabic is the coach's language and the app default. */
export const DEFAULT_LOCALE: Locale = 'ar'

export const initI18n = (locale: Locale = DEFAULT_LOCALE): typeof i18n => {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      interpolation: { escapeValue: false },
    })
  }
  return i18n
}

export const directionFor = (locale: Locale): 'rtl' | 'ltr' => (locale === 'ar' ? 'rtl' : 'ltr')

/** Keeps the document in step with the chosen language. */
export const applyDocumentLocale = (locale: Locale): void => {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.documentElement.dir = directionFor(locale)
}
