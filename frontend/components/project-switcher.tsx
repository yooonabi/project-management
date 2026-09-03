'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'

export function ProjectSwitcher({
  className,
  onSelect,
}: {
  className?: string
  onSelect?: () => void
}) {
  const store = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const project = store.currentProject

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Switch project"
        className="flex h-9 max-w-[10rem] items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-left transition-colors hover:bg-muted sm:max-w-[16rem]"
      >
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-chart-5/15 text-xs font-bold text-chart-5">
          {project?.key ?? '—'}
        </span>
        <span className="hidden min-w-0 flex-1 truncate text-sm font-medium text-foreground sm:inline">
          {project?.name ?? 'No project'}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-full overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg sm:min-w-[16rem]">
          {store.visibleProjects.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                store.selectProject(item.id)
                setOpen(false)
                onSelect?.()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted',
                item.id === store.currentProjectId && 'bg-muted',
              )}
            >
              <span className="inline-flex size-6 items-center justify-center rounded-md bg-chart-5/15 text-xs font-bold text-chart-5">
                {item.key}
              </span>
              {item.name}
            </button>
          ))}
          {store.visibleProjects.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No projects you can access</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
