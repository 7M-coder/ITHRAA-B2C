import { Descriptions, Modal, List } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Accommodation } from '../types/domain'
import { roomTypes } from '../utils/rooms'
interface Props {
  record: Accommodation
  onClose: () => void
}
/** Displays saved inventory and contract periods. @param props - Housing record and close callback. @returns Details dialog. */
export function AccommodationDetails({ record, onClose }: Props) {
  const { t, i18n } = useTranslation('accommodation')
  return (
    <Modal open title={record.name} onCancel={onClose} footer={null}>
      <Descriptions
        column={1}
        items={[
          { key: 'city', label: t('city'), children: t(record.city) },
          {
            key: 'classification',
            label: t('classification'),
            children: t('ratings.' + record.classification)
          },
          { key: 'capacity', label: t('capacity'), children: record.capacity },
          ...roomTypes.map((key) => ({
            key,
            label: t('rooms.' + key),
            children: record.rooms[key]
          })),
          { key: 'number', label: t('unifiedNumber'), children: record.unifiedNumber },
          {
            key: 'price',
            label: t('contractPrice'),
            children:
              record.contractPrice === undefined
                ? t('notRecorded')
                : new Intl.NumberFormat(i18n.language, {
                    style: 'currency',
                    currency: 'SAR'
                  }).format(record.contractPrice)
          },
          { key: 'start', label: t('contractStart'), children: record.contractStart },
          { key: 'end', label: t('contractEnd'), children: record.contractEnd },
          {
            key: 'board',
            label: t('catering'),
            children: t(record.catering ? (record.board ?? 'no') : 'no')
          }
        ]}
      />
      <List
        header={t('periods')}
        dataSource={record.periods}
        renderItem={(period, index) => (
          <List.Item>
            {index + 1}: {period.start} → {period.end}
          </List.Item>
        )}
      />
    </Modal>
  )
}
