
import { useTranslation } from 'react-i18next'
import { addDays, type LocalDate } from '@/domain/model/local-date'
import type { LogEntry } from '@/domain/model/log-entry'
import { ProgressBar } from '../components/progress-bar'
import { formatPercent } from '../format'
import { useAsyncData } from '../hooks/use-async-data'
import { useUseCases } from '../hooks/use-cases'

interface Props {
  today: LocalDate
}

interface Day {
  date: LocalDate
  completion: number
  entries: number
}

const WINDOW_DAYS = 30

export const HistoryScreen = ({ today }: Props) => {
  const { t } = useTranslation()
  const useCases = useUseCases()
  const { data: days } = useAsyncData<readonly Day[]>(async () => {
    const logs = await useCases.logArchive.all()
    const byDate = new Map<string, LogEntry[]>()
    for (const entry of logs) {
      const bucket = byDate.get(entry.date) ?? []
      bucket.push(entry)
      byDate.set(entry.date, bucket)
    }

    const candidates = Array.from({ length: WINDOW_DAYS }, (_, offset) => addDays(today, -offset)).filter((date) =>
      byDate.has(date),
    )

    return Promise.all(
      candidates.map(async (date) => {
        const progress = await useCases.getDayProgress.execute(date)
        return { date, completion: progress.completion, entries: byDate.get(date)?.length ?? 0 }
      }),
    )
  }, [useCases, today])

  if (days === null) return <p className="p-4 text-slate-400">{t('common.loading')}</p>

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold text-slate-100">{t('history.heading')}</h1>

      {days.length === 0 ? (
        <p className="rounded-2xl bg-slate-900 p-6 text-center text-sm text-slate-500">{t('history.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {days.map((day) => (
            <li key={day.date} className="flex flex-col gap-2 rounded-2xl bg-slate-900 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-slate-100">{day.date}</span>
                <span className="text-sm text-slate-400">{formatPercent(day.completion)}</span>
              </div>
              <ProgressBar ratio={day.completion} label={`${t('history.completion')} ${day.date}`} />
              <span className="text-xs text-slate-500">{t('history.entries', { count: day.entries })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
