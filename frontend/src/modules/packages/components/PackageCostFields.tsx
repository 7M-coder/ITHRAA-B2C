import { Button, Card, Form, Input, InputNumber, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import type { EditorStepProps } from '../types/editorProps'
import type { CostItem, StayRoom } from '../types/editor'
import { editorData } from '../utils/finance'
import { createEntityId } from '../utils/domain'
import { PackageRoomCost } from './PackageRoomCost'
import { PackageBedTaxes } from './PackageBedTaxes'
import { EditorField } from './EditorField'
/** Captures raw stay and service costs while preserving empty amounts. @param props - Controlled package. @returns Cost inputs. */
export function PackageCostFields({ item, onChange }: EditorStepProps) {
  const { t } = useTranslation('packages')
  const e = editorData(item)
  const taxOptions = ['included', 'excluded', 'unknown'].map((value) => ({
    value,
    label: t(`editor.tax.${value}`)
  }))
  const roomUpdate = (id: string, n: number, patch: Partial<StayRoom>) =>
    onChange({
      ...item,
      editor: {
        ...e,
        stays: e.stays.map((s) =>
          s.id === id
            ? { ...s, rooms: s.rooms.map((r) => (r.occupancy === n ? { ...r, ...patch } : r)) }
            : s
        )
      }
    })
  const costUpdate = (id: string, patch: Partial<CostItem>) =>
    onChange({
      ...item,
      editor: { ...e, costs: e.costs.map((c) => (c.id === id ? { ...c, ...patch } : c)) }
    })
  return (
    <div className="space-y-5">
      <PackageBedTaxes rates={e.bedTaxes} />
      <h3>{t('editor.stayCosts')}</h3>
      {e.stays.map((s, i) => (
        <Card key={s.id} title={`${i + 1}. ${s.hotel || t('editor.stay')}`}>
          {s.rooms
            .filter((r) => r.enabled)
            .map((room) => (
              <PackageRoomCost
                key={room.occupancy}
                room={room}
                stay={s}
                index={i}
                currency={item.currency}
                rates={e.bedTaxes}
                onChange={(patch) => roomUpdate(s.id, room.occupancy, patch)}
              />
            ))}
        </Card>
      ))}
      <h3>{t('editor.serviceCosts')}</h3>
      {e.costs.map((c) => (
        <Card
          key={c.id}
          extra={
            <Button
              danger
              onClick={() =>
                onChange({ ...item, editor: { ...e, costs: e.costs.filter((x) => x.id !== c.id) } })
              }
            >
              {t('actions.remove')}
            </Button>
          }
        >
          <Form layout="vertical">
            <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              <EditorField label={t('editor.costName')} text>
                <Input
                  aria-label={t('editor.costName')}
                  value={c.name}
                  onChange={(v) => costUpdate(c.id, { name: v.target.value })}
                />
              </EditorField>
              <EditorField label={t('editor.amount')}>
                <InputNumber
                  changeOnBlur={false}
                  aria-label={t('editor.amount')}
                  className="w-full!"
                  value={c.amount}
                  onChange={(amount) => costUpdate(c.id, { amount })}
                />
              </EditorField>
              <EditorField label={t('editor.costBasis')}>
                <Select
                  aria-label={t('editor.costBasis')}
                  value={c.basis}
                  options={['person', 'group'].map((value) => ({
                    value,
                    label: t(`editor.${value}`)
                  }))}
                  onChange={(basis) => costUpdate(c.id, { basis })}
                />
              </EditorField>
              {c.basis === 'group' && (
                <EditorField label={t('editor.divisor')}>
                  <InputNumber
                    changeOnBlur={false}
                    aria-label={t('editor.divisor')}
                    className="w-full!"

                    value={c.divisor}
                    onChange={(divisor) => costUpdate(c.id, { divisor })}
                  />
                </EditorField>
              )}
              <EditorField label={t('editor.appliesTo')}>
                <Select
                  aria-label={t('editor.appliesTo')}
                  value={c.optionId ?? 'all'}
                  onChange={(id) => costUpdate(c.id, { optionId: id === 'all' ? null : id })}
                  options={[
                    { value: 'all', label: t('editor.allOptions') },
                    ...e.options.map((o, i) => ({
                      value: o.id,
                      label: o.name || `${t('editor.option')} ${i + 1}`
                    }))
                  ]}
                />
              </EditorField>
              <EditorField label={t('editor.taxLabel')}>
                <Select
                  aria-label={t('editor.taxLabel')}
                  value={c.tax}
                  options={taxOptions}
                  onChange={(tax) => costUpdate(c.id, { tax })}
                />
              </EditorField>
            </div>
          </Form>
        </Card>
      ))}
      <Button
        onClick={() =>
          onChange({
            ...item,
            editor: {
              ...e,
              costs: [
                ...e.costs,
                {
                  id: createEntityId('cost'),
                  name: '',
                  amount: null,
                  basis: 'person',
                  divisor: null,
                  optionId: null,
                  tax: 'unknown'
                }
              ]
            }
          })
        }
      >
        {t('editor.addCost')}
      </Button>
    </div>
  )
}
