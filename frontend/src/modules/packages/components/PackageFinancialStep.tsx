import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Select
} from 'antd'
import { useTranslation } from 'react-i18next'
import type { EditorStepProps } from '../types/editorProps'
import type { OccupancyOption } from '../types/editor'
import { editorData, optionCost } from '../utils/finance'
import { createEntityId } from '../utils/domain'
import { PackageDateInput } from './PackageDateInput'
import { EditorField } from './EditorField'
import { PackageCostFields } from './PackageCostFields'
/** Edits manually chosen occupancy combinations and independent financial modes. @param props - Controlled package. @returns Financial fields. */
export function PackageFinancialStep({ item, onChange }: EditorStepProps) {
  const { t } = useTranslation('packages')
  const e = editorData(item)
  const { modal } = App.useApp()
  const removeOption = (id: string) => {
    const remove = () =>
      onChange({
        ...item,
        editor: {
          ...e,
          options: e.options.filter((o) => o.id !== id),
          costs: e.costs.filter((c) => c.optionId !== id)
        }
      })
    if (e.costs.some((c) => c.optionId === id))
      modal.confirm({
        title: t('editor.removeOption'),
        content: t('editor.removeOptionConfirm'),
        okText: t('actions.remove'),
        cancelText: t('actions.cancel'),
        onOk: remove
      })
    else remove()
  }
  const update = (id: string, patch: Partial<OccupancyOption>) =>
    onChange({
      ...item,
      editor: { ...e, options: e.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) }
    })
  return (
    <div className="space-y-5">
      <Radio.Group
        aria-label={t('editor.mode')}
        value={e.mode}
        onChange={(v) => onChange({ ...item, editor: { ...e, mode: v.target.value } })}
      >
        <Radio.Button value="approved_price">{t('editor.approvedPrice')}</Radio.Button>
        <Radio.Button value="cost_draft">{t('editor.costDraft')}</Radio.Button>
      </Radio.Group>
      <Alert
        type="info"
        showIcon
        message={t(e.mode === 'approved_price' ? 'editor.approvedNote' : 'editor.costNote')}
      />
      {!e.options.length && <Empty description={t('editor.noOptions')} />}
      {e.options.map((o, index) => (
        <Card
          key={o.id}
          title={`${t('editor.option')} ${index + 1}`}
          extra={
            <Button danger onClick={() => removeOption(o.id)}>
              {t('actions.remove')}
            </Button>
          }
        >
          {o.needsReview && (
            <Checkbox
              className="mb-4"
              checked={false}
              onChange={(v) => update(o.id, { needsReview: !v.target.checked })}
            >
              {t('editor.confirmOption')}
            </Checkbox>
          )}
          <Form layout="vertical">
            <EditorField label={t('editor.optionName')} text>
              <Input
                aria-label={t('editor.optionName')}
                value={o.name}
                onChange={(v) => update(o.id, { name: v.target.value })}
              />
            </EditorField>
            <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              {e.stays.map((s, i) => (
                <EditorField
                  key={s.id}
                  label={`${i + 1}. ${s.hotel || s.city || t('editor.stay')}`}
                >
                  <Select
                    aria-label={`${t('editor.selectOccupancy')} ${i + 1}`}
                    allowClear
                    value={o.selections[s.id]}
                    options={s.rooms
                      .filter((r) => r.enabled)
                      .map((r) => ({
                        value: r.occupancy,
                        label: t('editor.occupancy', { count: r.occupancy })
                      }))}
                    onChange={(v) => {
                      const selections = { ...o.selections }
                      if (v === undefined) delete selections[s.id]
                      else selections[s.id] = v
                      update(o.id, { selections })
                    }}
                  />
                </EditorField>
              ))}
            </div>
            {e.mode === 'approved_price' ? (
              <div className="grid gap-x-4 sm:grid-cols-2">
                <EditorField label={t('editor.amountPerPerson')}>
                  <InputNumber
                    changeOnBlur={false}
                    aria-label={t('editor.amountPerPerson')}
                    className="w-full!"
                    value={o.approvedAmount}
                    onChange={(approvedAmount) => update(o.id, { approvedAmount })}
                  />
                </EditorField>
                <EditorField label={t('editor.taxLabel')}>
                  <Select
                    aria-label={t('editor.taxLabel')}
                    value={o.tax}
                    onChange={(tax) => update(o.id, { tax })}
                    options={['included', 'excluded', 'unknown'].map((value) => ({
                      value,
                      label: t(`editor.tax.${value}`)
                    }))}
                  />
                </EditorField>
              </div>
            ) : (
              <p>
                {t('editor.estimatedCost')}:{' '}
                {optionCost(item, o).total?.toFixed(2) ?? t('editor.incomplete')}{' '}
                {item.currency === 'SAR' ? t('editor.riyal') : item.currency}
              </p>
            )}
            <EditorField label={t('editor.optionNotes')} text>
              <Input.TextArea
                aria-label={t('editor.optionNotes')}
                value={o.notes}
                onChange={(v) => update(o.id, { notes: v.target.value })}
              />
            </EditorField>
          </Form>
        </Card>
      ))}
      <Button
        onClick={() =>
          onChange({
            ...item,
            editor: {
              ...e,
              options: [
                ...e.options,
                {
                  id: createEntityId('option'),
                  name: '',
                  selections: {},
                  approvedAmount: null,
                  tax: 'unknown',
                  notes: ''
                }
              ]
            }
          })
        }
      >
        {t('editor.addOption')}
      </Button>
      {e.mode === 'cost_draft' ? (
        <PackageCostFields item={item} onChange={onChange} />
      ) : (
        <Card title={t('editor.approval')}>
          <Form layout="vertical">
            <div className="grid gap-x-4 sm:grid-cols-3">
              <EditorField label={t('editor.approvedBy')} text>
                <Input
                  aria-label={t('editor.approvedBy')}
                  value={e.approval.by}
                  onChange={(v) =>
                    onChange({
                      ...item,
                      editor: { ...e, approval: { ...e.approval, by: v.target.value } }
                    })
                  }
                />
              </EditorField>
              <EditorField label={t('editor.approvalDate')}>
                <PackageDateInput
                  label={t('editor.approvalDate')}
                  value={e.approval.date}
                  onChange={(v) =>
                    onChange({
                      ...item,
                      editor: { ...e, approval: { ...e.approval, date: v } }
                    })
                  }
                />
              </EditorField>
              <EditorField label={t('editor.approvalRef')} text>
                <Input
                  aria-label={t('editor.approvalRef')}
                  value={e.approval.reference}
                  onChange={(v) =>
                    onChange({
                      ...item,
                      editor: { ...e, approval: { ...e.approval, reference: v.target.value } }
                    })
                  }
                />
              </EditorField>
            </div>
          </Form>
          <p className="text-sm text-muted">{t('editor.manualApproval')}</p>
        </Card>
      )}
    </div>
  )
}
