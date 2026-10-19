import type { ReactNode } from 'react'
interface Props {
  title: string
  description: string
  action?: ReactNode
}
/** Renders a quiet page title and primary action. @param props - Heading content. @returns Page header. */
export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="mb-3 h-1 w-8 rounded-full bg-[#c19f79]" />
        <h1 className="m-0 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mb-0 mt-2 text-sm text-muted">{description}</p>
      </div>
      {action}
    </div>
  )
}
