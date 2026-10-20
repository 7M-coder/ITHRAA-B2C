import { Avatar, Button, Descriptions, Divider, Drawer, Grid } from 'antd'
import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { daysUntil, formatDate, money } from '../../core/utils/domain'
import { nationalityLabel } from '../utils/profile'
interface Props {
  employeeId?: string
  onClose: () => void
  onEdit: () => void
}
/** Displays a live employee record without leaving the list. @param props - Selected ID and drawer actions. @returns Employee profile drawer. */
export function EmployeeProfile({ employeeId, onClose, onEdit }: Props) {
  const { t, i18n } = useTranslation(['employees', 'common'])
  const screens = Grid.useBreakpoint()
  const employee = useDemoStore((s) => s.employees.find((e) => e.id === employeeId))
  const text = (value?: string) => value || t('notRecorded')
  const date = (value?: string) => (value ? formatDate(value, i18n.language) : t('notRecorded'))
  const expiry = employee ? daysUntil(employee.idExpiryDate) : 0
  return (
    <Drawer
      open={!!employee}
      title={t('profile')}
      onClose={onClose}
      placement={i18n.resolvedLanguage === 'ar' ? 'right' : 'left'}
      width={screens.sm ? 600 : '100%'}
      extra={
        <Button icon={<EditOutlined />} onClick={onEdit}>
          {t('edit')}
        </Button>
      }
    >
      {employee && (
        <>
          <div className="mb-6 flex items-center gap-4">
            <Avatar size={64} icon={<UserOutlined />} className="bg-teal-50! text-[#008186]!" />
            <div>
              <h2 className="mb-2 mt-0 text-xl font-bold">{employee.fullName}</h2>
              <p className="my-2 text-muted">{employee.jobTitle}</p>
            </div>
          </div>
          <Divider orientation="start">{t('contactDetails')}</Divider>
          <Descriptions
            column={1}
            size="small"
            items={[
              {
                key: 'nationality',
                label: t('nationality'),
                children: nationalityLabel(employee, t)
              },
              {
                key: 'id',
                label: t('nationalId'),
                children: <span dir="ltr">{employee.nationalId}</span>
              },
              {
                key: 'expiry',
                label: t('identityDocument'),
                children: (
                  <span className={expiry < 0 ? 'text-red-700 dark:text-red-400' : ''}>
                    {t(expiry < 0 ? 'expiredOn' : 'expiresOn', {
                      date: date(employee.idExpiryDate)
                    })}
                  </span>
                )
              },
              {
                key: 'phone',
                label: t('phone'),
                children: employee.phone ? (
                  <a dir="ltr" href={`tel:${employee.phone}`}>
                    {employee.phone}
                  </a>
                ) : (
                  t('notRecorded')
                )
              },
              {
                key: 'email',
                label: t('email'),
                children: employee.email ? (
                  <a className="break-all" dir="ltr" href={`mailto:${employee.email}`}>
                    {employee.email}
                  </a>
                ) : (
                  t('notRecorded')
                )
              }
            ]}
          />
          <Divider orientation="start">{t('employmentDetails')}</Divider>
          <Descriptions
            column={1}
            size="small"
            items={[
              { key: 'department', label: t('department'), children: text(employee.department) },
              { key: 'startDate', label: t('startDate'), children: date(employee.startDate) },
              { key: 'job', label: t('jobTitle'), children: employee.jobTitle },
              {
                key: 'status',
                label: t('employmentStatus'),
                children: t(
                  employee.employmentStatus === 'Terminated' ? 'Terminated' : 'ActiveEmployee'
                )
              }
            ]}
          />
          <Divider orientation="start">{t('salaryDetails')}</Divider>
          <Descriptions
            column={1}
            size="small"
            items={[
              ...(['basicSalary', 'housingAllowance', 'transportAllowance'] as const).map(
                (key) => ({ key, label: t(key), children: money(employee[key], i18n.language) })
              ),
              {
                key: 'iban',
                label: t('bankIban'),
                children: (
                  <span className="break-all" dir="ltr">
                    {employee.bankIban}
                  </span>
                )
              },
              { key: 'gosi', label: t('gosiRate'), children: `${employee.gosiRate}%` }
            ]}
          />
        </>
      )}
    </Drawer>
  )
}
