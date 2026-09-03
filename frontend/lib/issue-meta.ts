import { Bug, Check, Sparkles, TrendingUp } from 'lucide-react'
import type { TaskType } from '@/lib/types'

export const typeConfig: Record<
  TaskType,
  { icon: typeof Bug; className: string; label: string }
> = {
  bug: { icon: Bug, className: 'text-chart-4', label: 'Bug' },
  feature: { icon: Sparkles, className: 'text-primary', label: 'Feature' },
  task: { icon: Check, className: 'text-muted-foreground', label: 'Task' },
  improvement: { icon: TrendingUp, className: 'text-chart-2', label: 'Improvement' },
}

const knownDots: Record<string, string> = {
  todo: 'bg-muted-foreground',
  'in-progress': 'bg-primary',
  'in-review': 'bg-chart-3',
  done: 'bg-chart-2',
}

const fallbackDots = ['bg-muted-foreground', 'bg-primary', 'bg-chart-3', 'bg-chart-2', 'bg-chart-5']

export function columnDot(columnId: string, index = 0): string {
  return knownDots[columnId] ?? fallbackDots[index % fallbackDots.length]
}

export const inputClass =
  'h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40'

export const selectClass =
  'h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40'
