import { Button, Tooltip } from 'antd'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  type?: 'primary' | 'default'
  className?: string
}

/** Displays an accessible icon action with a tooltip, including disabled actions. @param props - Icon, translated label and action options. @returns Icon-only action button. */
export function AccommodationActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  danger,
  type,
  className
}: Props) {
  return (
    <span className={`inline-flex w-fit self-start ${className ?? ''}`}>
      <Tooltip title={label} placement="top">
        <span className="inline-flex">
          <Button
            aria-label={label}
            shape="circle"
            type={type}
            danger={danger}
            disabled={disabled}
            onClick={onClick}
            icon={<Icon size={18} aria-hidden="true" />}
          />
        </span>
      </Tooltip>
    </span>
  )
}
