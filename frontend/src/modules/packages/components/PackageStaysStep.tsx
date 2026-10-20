import { App, Button, Card, Checkbox, Empty, Form, Input, InputNumber, Select } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { EditorStepProps } from '../types/editorProps'
import type { PackageStay } from '../types/editor'
import { editorData, newStay, removeStay } from '../utils/finance'
import { PackageStayPeriods } from './PackageStayPeriods'
import { demoCities, cityKey, cityHotels, changeStayCity } from '../utils/hotelCatalog'
import { EditorField } from './EditorField'
/** Edits stable stay stages and bed allocations; reordering leaves option links intact. @param props - Controlled package. @returns Stay editor. */
export function PackageStaysStep({ item, onChange }: EditorStepProps) {
  const { t } = useTranslation('packages')
  const { modal } = App.useApp()
  const e = editorData(item)
  const update = (id: string, patch: Partial<PackageStay>) =>
    onChange({
      ...item,
      editor: { ...e, stays: e.stays.map((s) => (s.id === id ? { ...s, ...patch } : s)) }
    })
  const move = (index: number, offset: number) => {
    const stays = [...e.stays]
    ;[stays[index], stays[index + offset]] = [stays[index + offset], stays[index]]
    onChange({ ...item, editor: { ...e, stays } })
  }
  const remove = (id: string) => {
    if (e.options.some((o) => id in o.selections))
      modal.confirm({
        title: t('editor.removeStay'),
        content: t('editor.removeStayConfirm'),
        okText: t('actions.remove'),
        cancelText: t('actions.cancel'),
        onOk: () => onChange(removeStay(item, id))
      })
    else onChange(removeStay(item, id))
  }
  return (
    <div className="space-y-5">
      <p className="text-muted">{t('editor.hotelDemoNote')}</p>
      <p className="text-muted">{t('editor.bedsNote')}</p>
      {!e.stays.length && <Empty description={t('editor.noStays')} />}
      {e.stays.map((s, index) => (
        <Card
          key={s.id}
          title={`${index + 1}. ${s.hotel || t('editor.stay')}`}
          extra={
            <div className="flex gap-1">
              <Button
                aria-label={t('editor.moveUp')}
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              />
              <Button
                aria-label={t('editor.moveDown')}
                icon={<ArrowDownOutlined />}
                disabled={index === e.stays.length - 1}
                onClick={() => move(index, 1)}
              />
              <Button
                danger
                aria-label={t('editor.removeStay')}
                icon={<DeleteOutlined />}
                onClick={() => remove(s.id)}
              />
            </div>
          }
        >
          <Form layout="vertical">
            <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              <EditorField label={t('editor.city')}>
                <Select
                  aria-label={t('editor.city')}
                  value={
                    demoCities.find((c) => c.key === cityKey(s.city))?.value || s.city || undefined
                  }
                  options={[
                    ...demoCities.map((c) => ({
                      value: c.value,
                      label: t(`editor.cities.${c.key}`)
                    })),
                    ...(s.city && !cityKey(s.city) ? [{ value: s.city, label: s.city }] : [])
                  ]}
                  onChange={(city) => update(s.id, changeStayCity(s, city))}
                />
              </EditorField>
              <EditorField label={t('editor.hotel')}>
                <Select
                  aria-label={t('editor.hotel')}
                  showSearch
                  optionFilterProp="label"
                  disabled={!cityKey(s.city)}
                  placeholder={t(cityKey(s.city) ? 'editor.chooseHotel' : 'editor.chooseCityFirst')}
                  value={s.hotel || undefined}
                  options={cityHotels(s.city, s.hotel).map((h) => ({
                    value: h.value,
                    label: h.key ? t(`editor.hotels.${h.key}`) : h.value
                  }))}
                  onChange={(hotel) => update(s.id, { hotel })}
                />
              </EditorField>
              <EditorField label={t('editor.kind')}>
                <Select
                  aria-label={t('editor.kind')}
                  value={s.kind}
                  options={['primary', 'transitional'].map((value) => ({
                    value,
                    label: t(`editor.${value}`)
                  }))}
                  onChange={(kind) => update(s.id, { kind })}
                />
              </EditorField>
              <EditorField label={t('editor.contractRef')} text>
                <Input
                  aria-label={t('editor.contractRef')}
                  value={s.contractRef}
                  onChange={(v) => update(s.id, { contractRef: v.target.value })}
                />
              </EditorField>
            </div>
            <PackageStayPeriods item={item} stay={s} onChange={(stay) => update(s.id, stay)} />
            <h4 className="mb-3">{t('editor.peoplePerRoom')}</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {s.rooms.map((room) => (
                <div key={room.occupancy} className="rounded-lg border border-line p-3">
                  <Checkbox
                    checked={room.enabled}
                    onChange={(v) => {
                      const rooms = s.rooms.map((r) =>
                        r.occupancy === room.occupancy ? { ...r, enabled: v.target.checked } : r
                      )
                      const options = e.options.map((o) => ({
                        ...o,
                        needsReview:
                          o.needsReview ||
                          (!v.target.checked && o.selections[s.id] === room.occupancy),
                        selections: Object.fromEntries(
                          Object.entries(o.selections).filter(
                            ([id, n]) => id !== s.id || n !== room.occupancy || v.target.checked
                          )
                        )
                      }))
                      onChange({
                        ...item,
                        editor: {
                          ...e,
                          stays: e.stays.map((x) => (x.id === s.id ? { ...s, rooms } : x)),
                          options
                        }
                      })
                    }}
                  >
                    {t('editor.occupancy', { count: room.occupancy })}
                  </Checkbox>
                  <EditorField label={t('editor.beds')}>
                    <InputNumber
                      changeOnBlur={false}
                      aria-label={`${t('editor.beds')} ${room.occupancy}`}
                      className="w-full!"
                      disabled={!room.enabled}

                      value={room.beds}
                      onChange={(beds) =>
                        update(s.id, {
                          rooms: s.rooms.map((r) =>
                            r.occupancy === room.occupancy ? { ...r, beds } : r
                          )
                        })
                      }
                    />
                  </EditorField>
                </div>
              ))}
            </div>
            <EditorField label={t('editor.notes')} text>
              <Input.TextArea
                aria-label={t('editor.notes')}
                value={s.notes}
                onChange={(v) => update(s.id, { notes: v.target.value })}
              />
            </EditorField>
          </Form>
        </Card>
      ))}
      <Button
        icon={<PlusOutlined />}
        onClick={() => onChange({ ...item, editor: { ...e, stays: [...e.stays, newStay()] } })}
      >
        {t('editor.addStay')}
      </Button>
    </div>
  )
}
