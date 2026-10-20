import { Checkbox, Form, Input, InputNumber, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import type { EditorStepProps } from '../types/editorProps'
import { editorData } from '../utils/finance'
import { PackageDateInput } from './PackageDateInput'
import { PackageDescriptionEditor } from './PackageDescriptionEditor'
import { SEASON_START, SEASON_END, earliestDate, latestDate } from '../utils/dates'
import { EditorField } from './EditorField'
/** Edits general package fields without requiring complete data for a draft. @param props - Controlled package. @returns General fields. */
export function PackageGeneralStep({ item, onChange }: EditorStepProps) {
  const { t } = useTranslation('packages')
  const e = editorData(item)
  return (
    <Form layout="vertical">
      <p className="mb-5 text-sm text-muted">
        {t('editor.fixedDefaults', {
          season: item.season,
          currency: item.currency === 'SAR' ? t('editor.riyal') : item.currency
        })}
      </p>
      <div className="grid gap-x-5 sm:grid-cols-2 lg:grid-cols-3">
        <EditorField label={t('fields.name')} text>
          <Input
            aria-label={t('fields.name')}
            value={item.name}
            onChange={(v) => onChange({ ...item, name: v.target.value })}
          />
        </EditorField>
        <EditorField label={t('editor.category')}>
          <Select
            aria-label={t('editor.category')}
            value={e.category || undefined}
            onChange={(category) => onChange({ ...item, editor: { ...e, category } })}
            options={[
              'luxury',
              'luxury_transitional',
              'premium',
              'premium_transitional',
              'basic',
              'basic_transitional',
              ...(['economy', 'standard'].includes(e.category) ? [e.category] : [])
            ].map((value) => ({
              value,
              label: t(`editor.categories.${value}`)
            }))}
          />
        </EditorField>
        <EditorField label={t('editor.capacity')}>
          <InputNumber
            changeOnBlur={false}
            aria-label={t('editor.capacity')}
            className="w-full!"

            value={e.capacity}
            onChange={(capacity) => onChange({ ...item, editor: { ...e, capacity } })}
          />
        </EditorField>
        <EditorField label={t('fields.startDate')}>
          <PackageDateInput
            label={t('fields.startDate')}
            value={item.startDate}
            minDate={SEASON_START}
            maxDate={earliestDate(item.endDate, SEASON_END)}
            onChange={(startDate) => onChange({ ...item, startDate })}
          />
        </EditorField>
        <EditorField label={t('fields.endDate')}>
          <PackageDateInput
            label={t('fields.endDate')}
            value={item.endDate}
            minDate={latestDate(item.startDate, SEASON_START)}
            maxDate={SEASON_END}
            onChange={(endDate) => onChange({ ...item, endDate })}
          />
        </EditorField>
      </div>
      <PackageDescriptionEditor item={item} onChange={onChange} />
      {e.needsReview && (
        <Checkbox
          checked={!e.needsReview}
          onChange={(v) => onChange({ ...item, editor: { ...e, needsReview: !v.target.checked } })}
        >
          {t('editor.confirmLegacy')}
        </Checkbox>
      )}
    </Form>
  )
}
