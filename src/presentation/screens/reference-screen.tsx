import { useTranslation } from 'react-i18next'
import { PLAN_RULES } from '@/infrastructure/seed/rules'

/** The coach's own notes, and the one set of numbers the plan actually gives. */
export const ReferenceScreen = () => {
  const { t, i18n } = useTranslation()
  const arabic = i18n.language !== 'en'

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold text-slate-100">{t('reference.heading')}</h1>

      <section className="rounded-2xl bg-slate-900 p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-100">{t('reference.macros')}</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Figure label={t('reference.calories')} value="2705.41" />
          <Figure label={t('reference.protein')} value="145.05" />
          <Figure label={t('reference.carbs')} value="416.34" />
          <Figure label={t('reference.fats')} value="54.69" />
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{t('reference.macrosNote')}</p>
      </section>

      {PLAN_RULES.map((rule) => (
        <section key={rule.id} className="rounded-2xl bg-slate-900 p-4">
          <h2 className="mb-2 text-base font-medium text-slate-100">{arabic ? rule.titleAr : rule.titleEn}</h2>
          <p className="text-sm leading-relaxed text-slate-300">{arabic ? rule.bodyAr : rule.bodyEn}</p>
        </section>
      ))}
    </div>
  )
}

const Figure = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-slate-950 p-3">
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="text-lg font-medium text-slate-100">{value}</dd>
  </div>
)
