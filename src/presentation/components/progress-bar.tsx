interface Props {
  ratio: number
  label: string
}

/** A single bar. Anything past the plan is shown in amber, not hidden. */
export const ProgressBar = ({ ratio, label }: Props) => {
  const clamped = Math.max(0, Math.min(ratio, 1))
  const over = ratio > 1.0001

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
    >
      <div
        className={`h-full rounded-full transition-[width] ${over ? 'bg-amber-500' : 'bg-emerald-500'}`}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  )
}
