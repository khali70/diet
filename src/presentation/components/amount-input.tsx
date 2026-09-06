import { useId } from 'react'
import type { Unit } from '@/domain/model/unit'
import { useTranslation } from 'react-i18next'

interface Props {
  label: string
  value: string
  unit: Unit
  onChange: (value: string) => void
  autoFocus?: boolean
}

/** A numeric amount with its unit spelled out beside it. */
export const AmountInput = ({ label, value, unit, onChange, autoFocus }: Props) => {
  const { t } = useTranslation()
  const id = useId()

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-slate-400">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.value)}
          className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-lg text-slate-100 focus:border-emerald-500 focus:outline-none"
        />
        <span className="text-slate-400">{t(`units.${unit}`)}</span>
      </div>
    </div>
  )
}
