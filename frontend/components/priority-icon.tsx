import { ChevronUp, Equal, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Priority } from '@/lib/types'

const config: Record<Priority, { label: string; icon: typeof ChevronUp; className: string }> = {
  high: { label: 'High priority', icon: ChevronUp, className: 'text-chart-4' },
  medium: { label: 'Medium priority', icon: Equal, className: 'text-chart-3' },
  low: { label: 'Low priority', icon: ChevronDown, className: 'text-chart-2' },
}

export function PriorityIcon({ priority }: { priority: Priority }) {
  const { label, icon: Icon, className } = config[priority]
  return (
    <span title={label} aria-label={label} className={cn('inline-flex items-center justify-center', className)}>
      <Icon className="size-4" strokeWidth={2.75} />
    </span>
  )
}
