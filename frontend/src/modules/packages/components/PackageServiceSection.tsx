import type { ReactNode } from 'react'
import { Card, Switch } from 'antd'

interface PackageServiceSectionProps {
  title: string
  enabled: boolean
  onToggle: (value: boolean) => void
  children: ReactNode
}

/** Displays an optional package-service section with an enable switch. @param props - Section content and state. @returns Service section card. */
export function PackageServiceSection({
  title,
  enabled,
  onToggle,
  children
}: PackageServiceSectionProps) {
  return (
    <Card
      size="small"
      title={title}
      extra={<Switch checked={enabled} onChange={onToggle} aria-label={title} />}
      className="mb-4"
    >
      {enabled ? children : null}
    </Card>
  )
}
