import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ImportMode } from '@/application/usecases/import-backup'
import { localDate, isLocalDate } from '@/domain/model/local-date'
import type { Settings } from '@/domain/model/settings'
import { LOCALES } from '@/domain/model/settings'
import { useLocale } from '../hooks/use-locale'
import { useUseCases } from '../hooks/use-cases'

export const SettingsScreen = () => {
  const { t } = useTranslation()
  const useCases = useUseCases()
  const { locale, setLocale } = useLocale()
  const fileInput = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<Settings | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)

  useEffect(() => {
    void useCases.settings.get().then(setSettings)
  }, [useCases])

  if (settings === null) return <p className="p-4 text-slate-400">{t('common.loading')}</p>

  const save = async (change: Partial<Settings>) => {
    setSettings(await useCases.updateSettings.execute(change))
  }

  const exportBackup = async () => {
    const backup = await useCases.exportBackup.execute()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `diet-backup-${backup.exportedAt.slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = async (mode: ImportMode) => {
    const file = fileInput.current?.files?.[0]
    if (file === undefined) return

    try {
      const parsed: unknown = JSON.parse(await file.text())
      const result = await useCases.importBackup.execute(parsed, mode)
      if (result.ok) {
        setMessage(t('settings.importDone', { count: result.value.imported }))
        setSettings(await useCases.settings.get())
      } else {
        setMessage(t('settings.importFailed'))
      }
    } catch {
      setMessage(t('settings.importFailed'))
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold text-slate-100">{t('settings.heading')}</h1>

      <section className="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4">
        <h2 className="text-lg font-medium text-slate-100">{t('settings.language')}</h2>
        <div className="flex gap-2">
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={locale === option}
              onClick={() => void setLocale(option)}
              className={`rounded-lg px-4 py-2 text-sm ${
                locale === option ? 'bg-emerald-600 text-white' : 'border border-slate-700 text-slate-200'
              }`}
            >
              {t(option === 'ar' ? 'settings.arabic' : 'settings.english')}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">{t('settings.planStart')}</span>
          <input
            type="date"
            value={settings.planStartDate}
            onChange={(event) => {
              if (isLocalDate(event.target.value)) void save({ planStartDate: localDate(event.target.value) })
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">{t('settings.planLength')}</span>
          <input
            type="number"
            min={1}
            value={settings.planLengthDays}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isInteger(value) && value > 0) void save({ planLengthDays: value })
            }}
            className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4">
        <h2 className="text-lg font-medium text-slate-100">{t('settings.backup')}</h2>
        <p className="text-xs leading-relaxed text-slate-500">{t('settings.backupNote')}</p>

        <button
          type="button"
          onClick={() => void exportBackup()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          {t('settings.export')}
        </button>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">{t('settings.import')}</span>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="text-sm text-slate-300 file:me-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-200"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void importBackup('merge')}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
          >
            {t('settings.importMerge')}
          </button>
          <button
            type="button"
            onClick={() => void importBackup('replace')}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
          >
            {t('settings.importReplace')}
          </button>
        </div>

        {message !== null && <p className="text-sm text-slate-300">{message}</p>}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-red-900 bg-slate-900 p-4">
        <h2 className="text-lg font-medium text-red-300">{t('settings.dangerZone')}</h2>
        {confirmingClear ? (
          <>
            <p className="text-sm text-slate-300">{t('settings.clearConfirm')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await useCases.importBackup.execute(
                    { formatVersion: 1, settings, logs: [] },
                    'replace',
                  )
                  setConfirmingClear(false)
                  setMessage(t('settings.cleared'))
                }}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white"
              >
                {t('settings.confirm')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200"
              >
                {t('settings.cancel')}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="self-start rounded-lg border border-red-800 px-4 py-2 text-sm text-red-300"
          >
            {t('settings.clearData')}
          </button>
        )}
      </section>
    </div>
  )
}
