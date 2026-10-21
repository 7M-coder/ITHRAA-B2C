import { Button, Card, Checkbox, Empty, Form, Input, Select } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { usePackageTranslations } from '../hooks/usePackageTranslations'
import type { EditorStepProps } from '../types/editorProps'
import type { PackageStay, RoomType } from '../types/editor'
import { editorData, newStay, removeStay } from '../utils/finance'
import { PackageStayPeriods } from './PackageStayPeriods'
import { changeStayCity, cityHotels, cityKey, demoCities } from '../utils/hotelCatalog'
import { EditorField } from './EditorField'

/** Edits hotel stays, travel dates, and package notes. @param props - Controlled package. @returns Stay editor. */
export function PackageStaysStep({ item, onChange }: EditorStepProps) {
  const { t } = usePackageTranslations()
  const editor = editorData(item)
  const update = (id: string, patch: Partial<PackageStay>) =>
    onChange({
      ...item,
      editor: {
        ...editor,
        stays: editor.stays.map((stay) => (stay.id === id ? { ...stay, ...patch } : stay))
      }
    })
  const move = (index: number, offset: number) => {
    const stays = [...editor.stays]
    ;[stays[index], stays[index + offset]] = [stays[index + offset], stays[index]]
    onChange({ ...item, editor: { ...editor, stays } })
  }
  return (
    <div className="space-y-5">
      <p className="text-muted">{t('editor.hotelDemoNote')}</p>
      {!editor.stays.length && <Empty description={t('editor.noStays')} />}
      {editor.stays.map((stay, index) => (
        <Card
          key={stay.id}
          title={`${index + 1}. ${stay.hotel || t('editor.stay')}`}
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
                disabled={index === editor.stays.length - 1}
                onClick={() => move(index, 1)}
              />
              <Button
                danger
                aria-label={t('editor.removeStay')}
                icon={<DeleteOutlined />}
                onClick={() => onChange(removeStay(item, stay.id))}
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
                    demoCities.find((city) => city.key === cityKey(stay.city))?.value ||
                    stay.city ||
                    undefined
                  }
                  options={[
                    ...demoCities.map((city) => ({
                      value: city.value,
                      label: t(`editor.cities.${city.key}`)
                    })),
                    ...(stay.city && !cityKey(stay.city)
                      ? [{ value: stay.city, label: stay.city }]
                      : [])
                  ]}
                  onChange={(city) => update(stay.id, changeStayCity(stay, city))}
                />
              </EditorField>
              <EditorField label={t('editor.hotel')}>
                <Select
                  aria-label={t('editor.hotel')}
                  showSearch
                  optionFilterProp="label"
                  disabled={!cityKey(stay.city)}
                  placeholder={t(
                    cityKey(stay.city) ? 'editor.chooseHotel' : 'editor.chooseCityFirst'
                  )}
                  value={stay.hotel || undefined}
                  options={cityHotels(stay.city, stay.hotel).map((hotel) => ({
                    value: hotel.value,
                    label: hotel.key ? t(`editor.hotels.${hotel.key}`) : hotel.value
                  }))}
                  onChange={(hotel) => update(stay.id, { hotel })}
                />
              </EditorField>
              <EditorField label={t('editor.kind')}>
                <Select
                  aria-label={t('editor.kind')}
                  value={stay.kind}
                  options={['primary', 'transitional'].map((value) => ({
                    value,
                    label: t(`editor.${value}`)
                  }))}
                  onChange={(kind) => update(stay.id, { kind })}
                />
              </EditorField>
              <EditorField label={t('editor.contractRef')} text>
                <Input
                  aria-label={t('editor.contractRef')}
                  value={stay.contractRef}
                  onChange={(event) => update(stay.id, { contractRef: event.target.value })}
                />
              </EditorField>
            </div>
            <PackageStayPeriods
              item={item}
              stay={stay}
              onChange={(updated) => update(stay.id, updated)}
            />
            <fieldset className="mb-5 border-0 p-0">
              <legend className="mb-3 text-sm font-semibold">
                {t('editor.roomTypesLabel', { defaultValue: t('fields.roomType') })}
              </legend>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {([2, 3, 4] as RoomType[]).map((type) => (
                  <Checkbox
                    key={type}
                    checked={(stay.roomTypes ?? []).includes(type)}
                    onChange={(event) =>
                      update(stay.id, {
                        roomTypes: ([2, 3, 4] as RoomType[]).filter((value) =>
                          value === type
                            ? event.target.checked
                            : (stay.roomTypes ?? []).includes(value)
                        )
                      })
                    }
                  >
                    {t(`editor.roomTypes.${type}`)}
                  </Checkbox>
                ))}
              </div>
            </fieldset>
            <EditorField label={t('editor.notes')} text>
              <Input.TextArea
                aria-label={t('editor.notes')}
                value={stay.notes}
                onChange={(event) => update(stay.id, { notes: event.target.value })}
              />
            </EditorField>
          </Form>
        </Card>
      ))}
      <Button
        icon={<PlusOutlined />}
        onClick={() =>
          onChange({ ...item, editor: { ...editor, stays: [...editor.stays, newStay()] } })
        }
      >
        {t('editor.addStay')}
      </Button>
    </div>
  )
}
