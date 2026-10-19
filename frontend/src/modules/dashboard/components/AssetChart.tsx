import { CarOutlined, LaptopOutlined, WalletOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { Asset } from '../../core/types/domain'
interface Props {
  assets: Asset[]
}
/** Renders counts across all asset statuses as horizontal bars. @param props - All custody records. @returns Accessible bar chart. */
export function AssetChart({ assets }: Props) {
  const { t } = useTranslation(['dashboard', 'common'])
  const counts = ['Car', 'Laptop', 'Advance'].map(
    (type) => assets.filter((a) => a.type === type).length
  )
  const max = Math.max(1, ...counts)
  return (
    <div className="space-y-6 py-5">
      {(['Car', 'Laptop', 'Advance'] as const).map((type, i) => (
        <div key={type}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted">
              {[<CarOutlined />, <LaptopOutlined />, <WalletOutlined />][i]}
              {t(type)}
            </span>
            <strong>{counts[i]}</strong>
          </div>
          <svg
            className="h-3 w-full"
            viewBox="0 0 300 12"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${t(type)}: ${counts[i]}`}
          >
            <rect width="300" height="12" rx="6" fill="var(--color-line)" />
            <rect
              width={(counts[i] / max) * 300}
              height="12"
              rx="6"
              fill={['#008186', '#00b5a4', '#c19f79'][i]}
            />
          </svg>
        </div>
      ))}
    </div>
  )
}
