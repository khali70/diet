import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import type { LocalDate } from '@/domain/model/local-date'
import { HistoryScreen } from './screens/history-screen'
import { ReferenceScreen } from './screens/reference-screen'
import { SettingsScreen } from './screens/settings-screen'
import { SwapScreen } from './screens/swap-screen'
import { TodayScreen } from './screens/today-screen'
import { useLocale } from './hooks/use-locale'
import { useUseCases } from './hooks/use-cases'

const NAV = [
  { to: '/today', key: 'today' },
  { to: '/swap', key: 'swap' },
  { to: '/history', key: 'history' },
  { to: '/reference', key: 'reference' },
  { to: '/settings', key: 'settings' },
] as const

export const App = () => {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { clock } = useUseCases()
  const [date, setDate] = useState<LocalDate>(() => clock.today())

  // The app is usually left open. Roll onto the new day when it arrives.
  useEffect(() => {
    const id = setInterval(() => setDate(clock.today()), 60_000)
    return () => clearInterval(id)
  }, [clock])

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100" lang={locale}>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayScreen date={date} />} />
          <Route path="/swap" element={<SwapScreen />} />
          <Route path="/history" element={<HistoryScreen today={date} />} />
          <Route path="/reference" element={<ReferenceScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>

      <nav
        aria-label={t('app.title')}
        className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-900/95 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-lg">
          {NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-[3.25rem] items-center justify-center px-1 text-center text-xs ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`
                }
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
