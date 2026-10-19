import { Card } from 'antd'
import type { ReactNode } from 'react'
interface Props {
  title: string
  value: ReactNode
  detail?: string
  icon: ReactNode
  warning?: boolean
}
/** Displays a labeled metric. @param props - Metric values. @returns KPI card. */
export function StatCard({ title, value, detail, icon, warning }: Props) {
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{title}</span>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${warning ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-[#008186]'}`}
        >
          {icon}
        </span>
      </div>
      <div className="my-3 text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{detail}</div>
    </Card>
  )
}
