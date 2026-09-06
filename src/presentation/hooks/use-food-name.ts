import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Food } from '@/domain/model/food'

/**
 * Picks the name for the current language. The Arabic name is the coach's own
 * wording; the English one is an app-supplied label.
 */
export const useFoodName = (): ((food: Food | undefined) => string) => {
  const { i18n } = useTranslation()
  return useCallback((food: Food | undefined) => (food === undefined ? '' : i18n.language === 'en' ? food.nameEn : food.nameAr), [i18n.language])
}
