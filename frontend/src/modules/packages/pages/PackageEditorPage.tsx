import { useRef, useState } from 'react'
import { Alert, App, Button, Card, Result } from 'antd'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { HajjPackage } from '../types/domain'
import { usePackageStore, usePackageStorageStatus } from '../hooks/usePackageStore'
import { useUnsavedPackage } from '../hooks/useUnsavedPackage'
import { packageSchema } from '../validations/schemas'
import { newPackage, PACKAGE_SEASON, PACKAGE_CURRENCY } from '../utils/editor'
import { editorData } from '../utils/finance'
import { PageHeader } from '@/modules/core/components/PageHeader'
import { PackageGeneralStep } from '../components/PackageGeneralStep'
import { PackageStaysStep } from '../components/PackageStaysStep'
import { PackageServicesStep } from '../components/PackageServicesStep'
import { PackageFinancialStep } from '../components/PackageFinancialStep'
import { PackageDetails } from '../components/PackageDetails'
/** Creates and edits locally persisted packages through five reviewable steps. @returns Package wizard page. */
export default function PackageEditorPage() {
  const { id } = useParams()
  const location = useLocation()
  const lang = location.pathname.split('/')[1]
  const navigate = useNavigate()
  const { t } = useTranslation('packages')
  const { message } = App.useApp()
  const packages = usePackageStore((s) => s.packages)
  const providers = usePackageStore((s) => s.providers)
  const savePackage = usePackageStore((s) => s.savePackage)
  const storageError = usePackageStorageStatus((s) => s.error)
  const original = packages.find((p) => p.id === id)
  const [item, setItem] = useState<HajjPackage>(() => structuredClone(original ?? newPackage()))
  const [baseline, setBaseline] = useState(() => JSON.stringify(item))
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<{ path: string; message: string; step: number }[]>([])
  const allow = useRef(false)
  useUnsavedPackage(JSON.stringify(item) !== baseline, allow)
  const change = (value: HajjPackage) => {
    allow.current = false
    setItem(id ? value : { ...value, season: PACKAGE_SEASON, currency: PACKAGE_CURRENCY })
    setErrors([])
  }
  const save = (status: 'draft' | 'available') => {
    const candidate = {
      ...item,
      ...(!id ? { season: PACKAGE_SEASON, currency: PACKAGE_CURRENCY } : {}),
      status,
      includedServices: item.includedServices.filter((v) => v.trim()),
      excludedServices: item.excludedServices.filter((v) => v.trim())
    }
    const result = packageSchema.safeParse(candidate)
    if (!result.success) {
      setErrors(
        result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
          step:
            i.path[0] === 'editor'
              ? i.path[1] === 'stays'
                ? 1
                : i.path[1] === 'services'
                  ? 2
                  : 3
              : 0
        }))
      )
      return
    }
    try {
      savePackage(result.data)
      setItem(result.data)
      if (usePackageStorageStatus.getState().error) {
        void message.warning(t('editor.sessionOnly'))
        return
      } else {
        setBaseline(JSON.stringify(result.data))
        void message.success(t('messages.saved'))
      }
      if (!id) {
        allow.current = true
        void navigate(`/${lang}/packages/${item.id}/edit`, { replace: true })
      }
    } catch (error) {
      const key = error instanceof Error ? error.message : 'invalid'
      setErrors([{ path: '', message: key, step: 0 }])
    }
  }
  if (id && !original)
    return (
      <Result
        status="404"
        title={t('errors.packageMissing')}
        extra={
          <Button onClick={() => navigate(`/${lang}/packages`)}>{t('editor.backList')}</Button>
        }
      />
    )
  const e = editorData(item)
  const canPublish = packageSchema.safeParse({ ...item, status: 'available' }).success
  return (
    <div className="pb-10">
      <PageHeader
        title={t(id ? 'editor.editTitle' : 'editor.createTitle')}
        description={t('editor.intro')}
        action={
          <Button onClick={() => navigate(`/${lang}/packages`)}>{t('editor.backList')}</Button>
        }
      />
      {storageError && (
        <Alert className="mb-5" type="warning" showIcon message={t('messages.storageError')} />
      )}
      <Card className="mb-5">
        <nav
          aria-label={t('editor.stepNavigation')}
          className="grid grid-cols-2 gap-2 lg:grid-cols-5"
        >
          {['general', 'stays', 'services', 'financial', 'review'].map((key, index) => (
            <Button
              key={key}
              type={step === index ? 'primary' : 'default'}
              aria-current={step === index ? 'step' : undefined}
              className="h-auto! min-h-12 whitespace-normal! px-3! py-2! text-start!"
              onClick={() => setStep(index)}
            >
              {index + 1} {t(`editor.steps.${key}`)}
            </Button>
          ))}
        </nav>
        <p className="mb-0 mt-4 text-sm text-muted">{t('editor.stepHelp')}</p>
      </Card>
      {errors.length > 0 && (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          message={t('editor.correctErrors')}
          description={
            <ul className="m-0 list-inside list-disc">
              {errors.map((error, i) => (
                <li key={i}>
                  <Button
                    type="link"
                    className="h-auto! whitespace-normal! p-0! text-start!"
                    onClick={() => setStep(error.step)}
                  >
                    {t(`editor.errorSections.${error.step}`)}:{' '}
                    {t(`editor.validation.${error.message}`, {
                      defaultValue: t(`errors.${error.message}`, {
                        defaultValue: t('errors.invalid')
                      })
                    })}
                  </Button>
                </li>
              ))}
            </ul>
          }
        />
      )}
      <Card
        title={t(`editor.steps.${['general', 'stays', 'services', 'financial', 'review'][step]}`)}
      >
        {step === 0 && <PackageGeneralStep item={item} onChange={change} providers={providers} />}{' '}
        {step === 1 && <PackageStaysStep item={item} onChange={change} />}{' '}
        {step === 2 && <PackageServicesStep item={item} onChange={change} />}{' '}
        {step === 3 && <PackageFinancialStep item={item} onChange={change} />}{' '}
        {step === 4 && (
          <PackageDetails
            item={item}
            provider={providers.find((p) => p.id === item.providerId)}
            onEdit={setStep}
          />
        )}
      </Card>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button disabled={step === 0} onClick={() => setStep(step - 1)}>
            {t('editor.previous')}
          </Button>
          <Button disabled={step === 4} onClick={() => setStep(step + 1)}>
            {t('editor.next')}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save('draft')}>{t('editor.saveDraft')}</Button>
          {e.mode === 'approved_price' && (
            <Button type="primary" disabled={!canPublish} onClick={() => save('available')}>
              {t('editor.saveAvailable')}
            </Button>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        {t(
          e.mode === 'cost_draft'
            ? 'editor.costNote'
            : canPublish
              ? 'editor.ready'
              : 'editor.availabilityHint'
        )}
      </p>
    </div>
  )
}
