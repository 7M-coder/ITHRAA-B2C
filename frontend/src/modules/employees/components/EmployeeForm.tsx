import { useEffect } from 'react'
import { App, Form, Input, InputNumber, Modal, Select, Divider } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Employee } from '../../core/types/domain'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { employeeSchema, fieldRule } from '../../core/validations/schemas'
interface Props {
  open: boolean
  employee?: Employee
  onClose: () => void
}
/** Edits employee details with schema-backed field errors. @param props - Dialog state. @returns Employee dialog. */
export function EmployeeForm({ open, employee, onClose }: Props) {
  const { t } = useTranslation(['employees', 'common'])
  const [form] = Form.useForm<Employee>()
  const save = useDemoStore((s) => s.saveEmployee)
  const { message } = App.useApp()
  const fields = employeeSchema.innerType().shape
  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue(
        employee || {
          nationality: 'Saudi',
          gosiRate: 9.75,
          basicSalary: 0,
          housingAllowance: 0,
          transportAllowance: 0,
          employmentStatus: 'Active',
          uncompensatedLeaveDays: 0
        }
      )
    }
  }, [open, employee, form])
  const submit = () => {
    const result = employeeSchema.safeParse({
      ...form.getFieldsValue(true),
      id: employee?.id || crypto.randomUUID()
    })
    if (!result.success) {
      form.setFields(
        result.error.issues.map((issue) => ({
          name: issue.path[0] as keyof Employee,
          errors: [
            t(
              [
                'nameError',
                'idError',
                'ibanError',
                'jobError',
                'idNationalityError',
                'unsafe'
              ].includes(issue.message)
                ? issue.message
                : 'invalid'
            )
          ]
        }))
      )
      return
    }
    try {
      save(result.data)
      void message.success(t('saved'))
      onClose()
    } catch {
      void message.error(t('saveError'))
    }
  }
  return (
    <Modal
      title={t(employee ? 'editEmployee' : 'addEmployee')}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t('save')}
      cancelText={t('cancel')}
      width={760}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={submit}
        onValuesChange={(changed) => {
          if (!employee && changed.nationality)
            form.setFieldValue('gosiRate', changed.nationality === 'Saudi' ? 9.75 : 0)
        }}
      >
        <Divider orientation="start">{t('personalDetails')}</Divider>
        <div className="grid gap-x-5 sm:grid-cols-2">
          <Form.Item name="fullName" label={t('name')} rules={[fieldRule(fields.fullName, t)]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item
            name="nationality"
            label={t('nationality')}
            rules={[{ required: true, message: t('required') }]}
          >
            <Select options={['Saudi', 'NonSaudi'].map((value) => ({ value, label: t(value) }))} />
          </Form.Item>
          <Form.Item
            name="nationalId"
            label={t('nationalId')}
            rules={[fieldRule(fields.nationalId, t)]}
          >
            <Input dir="ltr" maxLength={10} />
          </Form.Item>
          <Form.Item
            name="idExpiryDate"
            label={t('idExpiryDate')}
            rules={[fieldRule(fields.idExpiryDate, t)]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item name="jobTitle" label={t('jobTitle')} rules={[fieldRule(fields.jobTitle, t)]}>
            <Input />
          </Form.Item>
        </div>
        <Divider orientation="start">{t('salaryDetails')}</Divider>
        <Form.Item name="bankIban" label={t('bankIban')} rules={[fieldRule(fields.bankIban, t)]}>
          <Input dir="ltr" maxLength={24} placeholder="SA0000000000000000000000" />
        </Form.Item>
        <div className="grid gap-x-5 sm:grid-cols-2">
          {(['basicSalary', 'housingAllowance', 'transportAllowance', 'gosiRate'] as const).map(
            (key) => (
              <Form.Item key={key} name={key} label={t(key)} rules={[fieldRule(fields[key], t)]}>
                <InputNumber
                  className="w-full!"
                  min={0}
                  max={key === 'gosiRate' ? 100 : 1e10}
                  precision={2}
                />
              </Form.Item>
            )
          )}
        </div>
        <Divider orientation="start">{t('statusDetails')}</Divider>
        <div className="grid gap-x-5 sm:grid-cols-2">
          <Form.Item name="employmentStatus" label={t('employmentStatus')}>
            <Select
              options={[
                { value: 'Active', label: t('ActiveEmployee') },
                { value: 'Terminated', label: t('Terminated') }
              ]}
            />
          </Form.Item>
          <Form.Item
            name="uncompensatedLeaveDays"
            label={t('uncompensatedLeaveDays')}
            rules={[fieldRule(fields.uncompensatedLeaveDays, t)]}
          >
            <InputNumber className="w-full!" min={0} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
