import { useEffect } from 'react'
import { App, Button, Form, Input, InputNumber, Modal, Select, Switch } from 'antd'
import { useTranslation } from 'react-i18next'
import type { HajjPackage, PackageServices, ServiceProvider } from '../types/domain'
import {
  createPackageFieldRule,
  currencyCodeSchema,
  packageLinesSchema,
  packageLongTextSchema,
  packageSchema,
  packageTextSchema,
  requiredPackageTextSchema
} from '../validations/schemas'
import { getPackageDuration } from '../utils/domain'
import { PackageRowList } from './PackageRowList'
import { PackageServiceSection } from './PackageServiceSection'

const { TextArea } = Input
const sectionKeys = [
  'accommodation',
  'flights',
  'transportation',
  'mashair',
  'meals',
  'guidance',
  'visa',
  'additional'
] as const
type SectionKey = (typeof sectionKeys)[number]
type PackageFormValues = Omit<
  HajjPackage,
  'id' | 'includedServices' | 'excludedServices' | 'services'
> & {
  includedLines: string
  excludedLines: string
  enabled: Partial<Record<SectionKey, boolean>>
  services: PackageServices
}

interface PackageFormProps {
  open: boolean
  initial?: HajjPackage
  providers: ServiceProvider[]
  onCancel: () => void
  onSave: (item: HajjPackage) => void
}

/** Creates editor defaults from a package or a new empty package. @param item - Existing package. @returns Form-ready values. */
const emptyValues = (item?: HajjPackage): PackageFormValues => ({
  name: item?.name ?? '',
  description: item?.description ?? '',
  pilgrimType: item?.pilgrimType ?? 'domestic',
  season: item?.season ?? '',
  providerId: item?.providerId ?? '',
  startDate: item?.startDate ?? '',
  endDate: item?.endDate ?? '',
  price: item?.price ?? 0,
  currency: item?.currency ?? 'SAR',
  bookingPolicy: item?.bookingPolicy ?? '',
  cancellationPolicy: item?.cancellationPolicy ?? '',
  bookingChannel: item?.bookingChannel ?? '',
  status: item?.status ?? 'draft',
  includedLines: item?.includedServices.join('\n') ?? '',
  excludedLines: item?.excludedServices.join('\n') ?? '',
  enabled: Object.fromEntries(
    sectionKeys.map((key) => [key, Boolean(item?.services[key])])
  ) as PackageFormValues['enabled'],
  services: item?.services ?? {}
})

const sectionDefaults: Record<SectionKey, unknown> = {
  accommodation: [],
  flights: [],
  transportation: [],
  mashair: { mina: '', arafah: '', muzdalifah: '', campLevel: '', facilities: '', transport: '' },
  meals: { dailyMeals: null, mealTypes: '', locations: '', includedDays: '', dietaryOptions: '' },
  guidance: {
    religiousGuidance: '',
    organizationalGuidance: '',
    languages: '',
    supportChannels: '',
    fieldSupport: '',
    healthServices: ''
  },
  visa: { included: false, visaType: '', requirements: '', responsibleParty: '' },
  additional: []
}

/** Provides a translated package editor with optional typed service sections. @param props - Modal state and save callbacks. @returns Package form modal. */
export function PackageForm({ open, initial, providers, onCancel, onSave }: PackageFormProps) {
  const { t } = useTranslation('packages')
  const { message } = App.useApp()
  const [form] = Form.useForm<PackageFormValues>()
  const startDate = Form.useWatch('startDate', form)
  const endDate = Form.useWatch('endDate', form)
  const enabled = Form.useWatch('enabled', form) ?? {}

  useEffect(() => {
    if (open) form.setFieldsValue(emptyValues(initial))
  }, [form, initial, open])

  const toggleSection = (key: SectionKey, value: boolean) => {
    form.setFieldValue(['enabled', key], value)
    if (value && !form.getFieldValue(['services', key]))
      form.setFieldValue(['services', key], sectionDefaults[key])
  }

  const submit = (values: PackageFormValues) => {
    const services: PackageServices = {}
    for (const key of sectionKeys) {
      if (values.enabled[key]) Object.assign(services, { [key]: values.services[key] })
    }
    const candidate: HajjPackage = {
      id: initial?.id ?? `package-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      name: values.name,
      description: values.description,
      pilgrimType: values.pilgrimType,
      season: values.season,
      providerId: values.providerId,
      startDate: values.startDate,
      endDate: values.endDate,
      price: values.price,
      currency: values.currency.toUpperCase(),
      bookingPolicy: values.bookingPolicy,
      cancellationPolicy: values.cancellationPolicy,
      bookingChannel: values.bookingChannel,
      includedServices: values.includedLines
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      excludedServices: values.excludedLines
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      services,
      status: values.status
    }
    const result = packageSchema.safeParse(candidate)
    if (!result.success) {
      const key = result.error.issues[0]?.message ?? 'invalid'
      void message.error(t(`errors.${key}`, { defaultValue: t('errors.invalid') }))
      return
    }
    onSave(result.data)
    form.resetFields()
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={initial ? t('form.editTitle') : t('form.createTitle')}
      width={920}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit} initialValues={emptyValues(initial)}>
        <section className="mb-5">
          <h3 className="mb-3 text-base font-bold">{t('sections.general')}</h3>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              name="name"
              label={t('fields.name')}
              rules={[createPackageFieldRule(requiredPackageTextSchema, t)]}
            >
              <Input maxLength={120} />
            </Form.Item>
            <Form.Item
              name="pilgrimType"
              label={t('fields.pilgrimType')}
              rules={[{ required: true }]}
            >
              <Select
                options={['domestic', 'international'].map((value) => ({
                  value,
                  label: t(`values.${value}`)
                }))}
              />
            </Form.Item>
            <Form.Item
              name="season"
              label={t('fields.season')}
              rules={[createPackageFieldRule(requiredPackageTextSchema, t)]}
            >
              <Input maxLength={50} placeholder={t('fields.seasonHint')} />
            </Form.Item>
            <Form.Item
              name="providerId"
              label={t('fields.provider')}
              rules={[{ required: true, message: t('messages.required') }]}
            >
              <Select
                options={providers
                  .filter((provider) => provider.active)
                  .map((provider) => ({ value: provider.id, label: provider.name }))}
              />
            </Form.Item>
            <Form.Item
              name="startDate"
              label={t('fields.startDate')}
              rules={[{ required: true, message: t('messages.required') }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="endDate"
              label={t('fields.endDate')}
              rules={[{ required: true, message: t('messages.required') }]}
            >
              <Input type="date" />
            </Form.Item>
            <p className="-mt-4 mb-4 text-sm text-muted">
              {t('fields.duration')}: {getPackageDuration(startDate ?? '', endDate ?? '')}{' '}
              {t('values.days')}
            </p>
            <Form.Item name="status" label={t('fields.status')} rules={[{ required: true }]}>
              <Select
                options={['draft', 'available', 'paused', 'archived'].map((value) => ({
                  value,
                  label: t(`values.${value}`)
                }))}
              />
            </Form.Item>
            <Form.Item
              name="price"
              label={t('fields.price')}
              rules={[{ required: true, message: t('messages.required') }]}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item
              name="currency"
              label={t('fields.currency')}
              rules={[createPackageFieldRule(currencyCodeSchema, t)]}
            >
              <Input
                maxLength={3}
                onChange={(event) =>
                  form.setFieldValue('currency', event.target.value.toUpperCase())
                }
              />
            </Form.Item>
            <Form.Item
              name="description"
              label={t('fields.description')}
              className="md:col-span-2"
              rules={[createPackageFieldRule(packageLongTextSchema, t)]}
            >
              <TextArea rows={3} maxLength={2000} />
            </Form.Item>
          </div>
        </section>

        <section className="mb-5">
          <h3 className="mb-3 text-base font-bold">{t('sections.policies')}</h3>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              name="bookingPolicy"
              label={t('fields.bookingPolicy')}
              rules={[createPackageFieldRule(packageLongTextSchema, t)]}
            >
              <TextArea rows={3} maxLength={2000} />
            </Form.Item>
            <Form.Item
              name="cancellationPolicy"
              label={t('fields.cancellationPolicy')}
              rules={[createPackageFieldRule(packageLongTextSchema, t)]}
            >
              <TextArea rows={3} maxLength={2000} />
            </Form.Item>
            <Form.Item
              name="bookingChannel"
              label={t('fields.bookingChannel')}
              className="md:col-span-2"
              rules={[createPackageFieldRule(packageTextSchema, t)]}
            >
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item
              name="includedLines"
              label={t('fields.includedServices')}
              className="md:col-span-2"
              rules={[createPackageFieldRule(packageLinesSchema, t)]}
            >
              <TextArea rows={3} placeholder={t('fields.linesHint')} />
            </Form.Item>
            <Form.Item
              name="excludedLines"
              label={t('fields.excludedServices')}
              className="md:col-span-2"
              rules={[createPackageFieldRule(packageLinesSchema, t)]}
            >
              <TextArea rows={3} placeholder={t('fields.linesHint')} />
            </Form.Item>
          </div>
        </section>

        <section className="mb-5">
          <h3 className="mb-3 text-base font-bold">{t('sections.services')}</h3>
          <PackageServiceSection
            title={t('services.accommodation')}
            enabled={Boolean(enabled.accommodation)}
            onToggle={(value) => toggleSection('accommodation', value)}
          >
            <PackageRowList
              name={['services', 'accommodation']}
              fields={[
                { name: 'name', label: 'accommodationName' },
                { name: 'city', label: 'city' },
                { name: 'location', label: 'location' },
                { name: 'classification', label: 'classification' },
                { name: 'roomType', label: 'roomType' },
                { name: 'peoplePerRoom', label: 'peoplePerRoom', numeric: true },
                { name: 'nights', label: 'nights', numeric: true },
                { name: 'checkIn', label: 'checkIn', date: true },
                { name: 'checkOut', label: 'checkOut', date: true },
                { name: 'amenities', label: 'amenities' }
              ]}
            />
          </PackageServiceSection>
          <PackageServiceSection
            title={t('services.flights')}
            enabled={Boolean(enabled.flights)}
            onToggle={(value) => toggleSection('flights', value)}
          >
            <PackageRowList
              name={['services', 'flights']}
              fields={[
                { name: 'airline', label: 'airline' },
                { name: 'origin', label: 'origin' },
                { name: 'destination', label: 'destination' },
                { name: 'departureAt', label: 'departureAt' },
                { name: 'arrivalAt', label: 'arrivalAt' },
                { name: 'flightNumber', label: 'flightNumber' },
                { name: 'travelClass', label: 'travelClass' },
                { name: 'baggageAllowance', label: 'baggageAllowance' }
              ]}
            />
          </PackageServiceSection>
          <PackageServiceSection
            title={t('services.transportation')}
            enabled={Boolean(enabled.transportation)}
            onToggle={(value) => toggleSection('transportation', value)}
          >
            <PackageRowList
              name={['services', 'transportation']}
              fields={[
                { name: 'vehicleType', label: 'vehicleType' },
                { name: 'origin', label: 'origin' },
                { name: 'destination', label: 'destination' },
                { name: 'route', label: 'route' },
                { name: 'schedule', label: 'schedule' },
                { name: 'serviceClass', label: 'serviceClass' }
              ]}
            />
          </PackageServiceSection>
          <PackageServiceSection
            title={t('services.mashair')}
            enabled={Boolean(enabled.mashair)}
            onToggle={(value) => toggleSection('mashair', value)}
          >
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              {(
                ['mina', 'arafah', 'muzdalifah', 'campLevel', 'facilities', 'transport'] as const
              ).map((key) => (
                <Form.Item
                  key={key}
                  name={['services', 'mashair', key]}
                  label={t(`fields.${key}`)}
                  rules={[createPackageFieldRule(packageTextSchema, t)]}
                >
                  <Input />
                </Form.Item>
              ))}
            </div>
          </PackageServiceSection>
          <PackageServiceSection
            title={t('services.meals')}
            enabled={Boolean(enabled.meals)}
            onToggle={(value) => toggleSection('meals', value)}
          >
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <Form.Item name={['services', 'meals', 'dailyMeals']} label={t('fields.dailyMeals')}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>
              {(['mealTypes', 'locations', 'includedDays', 'dietaryOptions'] as const).map(
                (key) => (
                  <Form.Item
                    key={key}
                    name={['services', 'meals', key]}
                    label={t(`fields.${key}`)}
                    rules={[createPackageFieldRule(packageTextSchema, t)]}
                  >
                    <Input />
                  </Form.Item>
                )
              )}
            </div>
          </PackageServiceSection>
          <PackageServiceSection
            title={t('services.guidance')}
            enabled={Boolean(enabled.guidance)}
            onToggle={(value) => toggleSection('guidance', value)}
          >
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              {(
                [
                  'religiousGuidance',
                  'organizationalGuidance',
                  'languages',
                  'supportChannels',
                  'fieldSupport',
                  'healthServices'
                ] as const
              ).map((key) => (
                <Form.Item
                  key={key}
                  name={['services', 'guidance', key]}
                  label={t(`fields.${key}`)}
                  rules={[createPackageFieldRule(packageTextSchema, t)]}
                >
                  <Input />
                </Form.Item>
              ))}
            </div>
          </PackageServiceSection>
          <PackageServiceSection
            title={t('services.visa')}
            enabled={Boolean(enabled.visa)}
            onToggle={(value) => toggleSection('visa', value)}
          >
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <Form.Item
                name={['services', 'visa', 'included']}
                label={t('fields.visaIncluded')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              {(['visaType', 'requirements', 'responsibleParty'] as const).map((key) => (
                <Form.Item
                  key={key}
                  name={['services', 'visa', key]}
                  label={t(`fields.${key}`)}
                  rules={[createPackageFieldRule(packageTextSchema, t)]}
                >
                  <Input />
                </Form.Item>
              ))}
            </div>
          </PackageServiceSection>
          <PackageServiceSection
            title={t('services.additional')}
            enabled={Boolean(enabled.additional)}
            onToggle={(value) => toggleSection('additional', value)}
          >
            <PackageRowList
              name={['services', 'additional']}
              fields={[
                { name: 'name', label: 'additionalName' },
                { name: 'description', label: 'description' },
                { name: 'included', label: 'includedFlag', toggle: true },
                { name: 'extraFee', label: 'extraFee' }
              ]}
            />
          </PackageServiceSection>
        </section>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button onClick={onCancel}>{t('actions.cancel')}</Button>
          <Button type="primary" htmlType="submit">
            {t('actions.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
