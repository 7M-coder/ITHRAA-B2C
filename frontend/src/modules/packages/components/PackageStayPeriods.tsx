import { Alert, App, InputNumber } from 'antd'
import { useTranslation } from 'react-i18next'
import type { PackageStay } from '../types/editor'
import type { HajjPackage } from '../types/domain'
import { stayPeriods, resizePeriods, withPeriods, MAX_STAY_PERIODS } from '../utils/periods'
import { stayNights, stayPeriodNights } from '../utils/finance'
import { SEASON_START, SEASON_END, earliestDate, latestDate, shiftDate } from '../utils/dates'
import { PackageDateInput } from './PackageDateInput'
import { EditorField } from './EditorField'
interface Props {
  item: HajjPackage
  stay: PackageStay
  onChange: (stay: PackageStay) => void
}
/** Edits sequential intervals for one hotel and sums their occupied nights. @param props - Controlled stay and parent program. @returns Period count and date inputs. */
export function PackageStayPeriods({ item, stay, onChange }: Props) {
  const { t } = useTranslation('packages')
  const { modal } = App.useApp()
  const periods = stayPeriods(stay)
  const resize = (count: number | null) => {
    if (count === null || !Number.isInteger(count) || count < 1 || count > MAX_STAY_PERIODS) return
    const apply = () => onChange(resizePeriods(stay, count))
    if (count < periods.length && periods.slice(count).some((p) => p.checkIn || p.checkOut))
      modal.confirm({
        title: t('editor.removePeriods'),
        content: t('editor.removePeriodsConfirm'),
        okText: t('actions.remove'),
        cancelText: t('actions.cancel'),
        onOk: apply
      })
    else apply()
  }
  return (
    <div className="my-5 space-y-4">
      <EditorField label={t('editor.periodCount')}>
        <InputNumber
          min={1}
          max={MAX_STAY_PERIODS}
          aria-label={t('editor.periodCount')}
          value={periods.length}
          onChange={resize}
        />
      </EditorField>
      {periods.length > MAX_STAY_PERIODS && (
        <Alert type="warning" showIcon message={t('editor.validation.periodLimit')} />
      )}
      <p className="text-sm text-muted">{t('editor.periodsHelp')}</p>
      {periods.map((period, index) => {
        const nights = stayNights(period.checkIn, period.checkOut)
        return (
          <section key={period.id} className="rounded-lg border border-line p-4">
            <h4 className="mb-3 mt-0">{t('editor.periodNumber', { number: index + 1 })}</h4>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <EditorField label={t('editor.checkIn')}>
                <PackageDateInput
                  label={`${t('editor.checkIn')} ${index + 1}`}
                  value={period.checkIn}
                  minDate={latestDate(SEASON_START, item.startDate, periods[index - 1]?.checkOut)}
                  maxDate={earliestDate(
                    SEASON_END,
                    shiftDate(item.endDate, -1),
                    shiftDate(period.checkOut, -1),
                    shiftDate(periods[index + 1]?.checkIn ?? '', -1)
                  )}
                  onChange={(checkIn) =>
                    onChange(
                      withPeriods(
                        stay,
                        periods.map((p) => (p.id === period.id ? { ...p, checkIn } : p))
                      )
                    )
                  }
                />
              </EditorField>
              <EditorField label={t('editor.checkOut')}>
                <PackageDateInput
                  label={`${t('editor.checkOut')} ${index + 1}`}
                  value={period.checkOut}
                  minDate={latestDate(
                    SEASON_START,
                    shiftDate(item.startDate, 1),
                    shiftDate(period.checkIn, 1)
                  )}
                  maxDate={earliestDate(SEASON_END, item.endDate, periods[index + 1]?.checkIn)}
                  onChange={(checkOut) =>
                    onChange(
                      withPeriods(
                        stay,
                        periods.map((p) => (p.id === period.id ? { ...p, checkOut } : p))
                      )
                    )
                  }
                />
              </EditorField>
            </div>
            <p className="mb-0 text-sm text-muted">
              {nights === null
                ? t('editor.incomplete')
                : t('editor.periodDuration', { nights, days: nights + 1 })}
            </p>
          </section>
        )
      })}
      <p className="font-semibold">
        {t('editor.totalNights')}: {stayPeriodNights(stay) ?? '—'}
      </p>
    </div>
  )
}
