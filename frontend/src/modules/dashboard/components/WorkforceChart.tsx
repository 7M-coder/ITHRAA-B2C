import { useTranslation } from 'react-i18next'
interface Props {
  saudi: number
  other: number
}
/** Accessible SVG donut with explicit values and legend. @param props - Nationality counts. @returns Donut chart. */
export function WorkforceChart({ saudi, other }: Props) {
  const { t } = useTranslation(['dashboard', 'common'])
  const total = saudi + other
  const percent = total ? saudi / total : 0
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 py-4">
      <div className="relative h-44 w-44">
        <svg
          viewBox="0 0 200 200"
          role="img"
          aria-label={`${t('Saudi')}: ${saudi}, ${t('NonSaudi')}: ${other}`}
          className="h-full w-full -rotate-90"
        >
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="20"
          />
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="#c19f79"
            strokeWidth="20"
            strokeDasharray={`${total ? 490 : 0} 490`}
          />
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="#008186"
            strokeWidth="20"
            strokeDasharray={`${percent * 490} 490`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold">{total}</span>
          <span className="mt-1 text-xs text-muted">{t('people')}</span>
        </div>
      </div>
      <div className="min-w-32 space-y-5">
        {[
          ['Saudi', saudi, 'bg-[#008186]'],
          ['NonSaudi', other, 'bg-[#c19f79]']
        ].map(([label, value, color]) => (
          <div key={label} className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            <span className="text-sm text-muted">{t(String(label))}</span>
            <strong className="ms-auto">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
