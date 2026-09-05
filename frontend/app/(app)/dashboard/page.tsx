'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Pencil,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatRelative } from '@/lib/format'
import { columnDot, typeConfig } from '@/lib/issue-meta'
import { UserAvatar } from '@/components/user-avatar'
import { PriorityIcon } from '@/components/priority-icon'
import { cn } from '@/lib/utils'
import type { Priority, TaskType } from '@/lib/types'

const DAY = 24 * 60 * 60 * 1000
const WEEK = 7 * DAY

const statusStroke: Record<string, string> = {
  todo: 'var(--chart-5)',
  'in-progress': 'var(--chart-1)',
  'in-review': 'var(--chart-3)',
  done: 'var(--chart-2)',
}

const statusFallback = ['var(--chart-5)', 'var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-4)']

const priorityOrder: Priority[] = ['high', 'medium', 'low']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function DonutChart({
  segments,
  total,
  hoveredId,
  onHover,
}: {
  segments: { id: string; label: string; count: number; color: string; dot: string }[]
  total: number
  hoveredId: string | null
  onHover: (id: string | null) => void
}) {
  const [tooltipPos, setTooltipPos] = useState({ x: 88, y: 40 })
  const r = 38
  const c = 2 * Math.PI * r
  let offset = 0
  const hovered = segments.find((s) => s.id === hoveredId)

  return (
    <div
      className="relative flex size-44 shrink-0 items-center justify-center"
      onMouseLeave={() => onHover(null)}
    >
      <svg className="size-44 -rotate-90 transform" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="none" r={r} stroke="var(--secondary)" strokeWidth="12" />
        {total === 0
          ? null
          : segments.map((seg) => {
              if (seg.count === 0) return null
              const len = (seg.count / total) * c
              const isHovered = hoveredId === seg.id
              const node = (
                <circle
                  key={seg.id}
                  cx="50"
                  cy="50"
                  fill="none"
                  r={r}
                  stroke={seg.color}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  strokeWidth={isHovered ? 14 : 12}
                  className="cursor-pointer transition-[stroke-width] duration-150"
                  style={{ opacity: hoveredId && !isHovered ? 0.45 : 1 }}
                  onMouseEnter={(e) => {
                    onHover(seg.id)
                    const rect = e.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect()
                    if (!rect) return
                    setTooltipPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    })
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect()
                    if (!rect) return
                    setTooltipPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    })
                  }}
                />
              )
              offset += len
              return node
            })}
      </svg>
      <div className="pointer-events-none absolute flex flex-col items-center justify-center px-2 text-center">
        <span className="text-2xl font-bold leading-none tracking-tight text-foreground">{total}</span>
        <span className="mt-1 max-w-[90px] truncate text-[11px] font-medium text-muted-foreground">
          Total work items
        </span>
      </div>
      {hovered ? (
        <div
          className="pointer-events-none absolute z-20 flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-md"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, calc(-100% - 10px))',
          }}
        >
          <span className={cn('size-2.5 shrink-0 rounded-sm', hovered.dot)} />
          <span>
            {hovered.label} <span className="font-semibold">{hovered.count}</span>
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default function DashboardPage() {
  const store = useStore()
  const [statusHoverId, setStatusHoverId] = useState<string | null>(null)
  const project = store.currentProject
  const issues = store.issues.filter((i) => i.projectId === store.currentProjectId)
  const doneId = project?.columns.find((c) => c.id === 'done' || c.title.toLowerCase() === 'done')?.id ?? 'done'
  const now = Date.now()
  const weekAgo = now - WEEK
  const weekAhead = now + WEEK

  const completed = issues.filter(
    (i) => i.column === doneId && new Date(i.updatedAt).getTime() >= weekAgo,
  ).length
  const updated = issues.filter((i) => new Date(i.updatedAt).getTime() >= weekAgo).length
  const created = issues.filter((i) => new Date(i.createdAt).getTime() >= weekAgo).length
  const dueSoon = issues.filter((i) => {
    if (!i.dueDate || i.column === doneId) return false
    const due = new Date(i.dueDate).getTime()
    return due >= now && due <= weekAhead
  }).length

  const statusSegments =
    project?.columns.map((column, index) => {
      const count = issues.filter((i) => i.column === column.id).length
      return {
        id: column.id,
        label: column.title,
        count,
        color: statusStroke[column.id] ?? statusFallback[index % statusFallback.length],
        dot: columnDot(column.id, index),
      }
    }) ?? []

  const total = issues.length
  const maxPriority = Math.max(1, ...priorityOrder.map((p) => issues.filter((i) => i.priority === p).length))
  const yMax = Math.max(3, maxPriority)
  const yTicks = Array.from({ length: yMax + 1 }, (_, i) => yMax - i)

  const typeEntries = (Object.keys(typeConfig) as TaskType[]).map((type) => {
    const count = issues.filter((i) => i.type === type).length
    return {
      type,
      count,
      pct: total === 0 ? 0 : Math.round((count / total) * 100),
      ...typeConfig[type],
    }
  })

  const activity = store.activities.filter((a) => issues.some((i) => i.id === a.issueId))

  const today = new Date()
  const todayActivity = activity.filter((a) => isSameDay(new Date(a.createdAt), today))
  const olderActivity = activity.filter((a) => !isSameDay(new Date(a.createdAt), today))

  const kpis = [
    {
      href: '/issues?filter=done-week',
      value: completed,
      label: 'completed',
      hint: 'in the last 7 days',
      icon: CheckCircle2,
      warn: false,
    },
    {
      href: '/issues',
      value: updated,
      label: 'updated',
      hint: 'in the last 7 days',
      icon: Pencil,
      warn: false,
    },
    {
      href: '/issues',
      value: created,
      label: 'created',
      hint: 'in the last 7 days',
      icon: ClipboardList,
      warn: false,
    },
    {
      href: '/issues?filter=overdue',
      value: dueSoon,
      label: 'due soon',
      hint: 'in the next 7 days',
      icon: Calendar,
      warn: dueSoon > 0,
    },
  ]

  function ActivityList({ items }: { items: typeof activity }) {
    if (items.length === 0) {
      return <p className="text-xs text-muted-foreground">No activity yet.</p>
    }
    return (
      <div className="space-y-4">
        {items.map((item) => {
          const actor = store.usersById[item.actorId]
          const issue = store.issues.find((i) => i.id === item.issueId)
          const column = project?.columns.find((c) => c.id === issue?.column)
          return (
            <div key={item.id} className="flex items-start gap-3">
              {actor ? <UserAvatar member={actor} size="sm" className="mt-0.5" /> : null}
              <div className="min-w-0 flex-1 text-xs leading-normal text-muted-foreground">
                <p className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-foreground">{actor?.name ?? 'Someone'}</span>
                  <span>{item.message}</span>
                  <Link
                    href={`/issues/${item.issueId}`}
                    className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
                  >
                    {item.issueId}
                    {issue ? `: ${issue.title}` : null}
                  </Link>
                  {column ? (
                    <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                      {column.title}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{formatRelative(item.createdAt)}</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow"
          >
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                kpi.warn ? 'bg-chart-3/15 text-chart-3' : 'bg-secondary text-muted-foreground',
              )}
            >
              <kpi.icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold leading-tight text-foreground">
                <span className="text-base font-bold">{kpi.value}</span> {kpi.label}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{kpi.hint}</p>
            </div>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="flex h-[380px] flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm lg:p-6">
          <div>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">Status overview</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Get a snapshot of the status of your work items.
                <Link href="/issues" className="ml-1 inline font-medium text-foreground hover:underline">
                  View all work items
                </Link>
              </p>
            </div>
            <div className="flex flex-col items-center justify-around gap-6 py-6 sm:flex-row">
              <DonutChart
                segments={statusSegments}
                total={total}
                hoveredId={statusHoverId}
                onHover={setStatusHoverId}
              />
              <div className="flex min-w-[130px] flex-col gap-3.5 text-xs">
                {statusSegments.map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 text-left font-medium text-muted-foreground transition-opacity',
                      statusHoverId && statusHoverId !== seg.id && 'opacity-45',
                    )}
                    onMouseEnter={() => setStatusHoverId(seg.id)}
                    onMouseLeave={() => setStatusHoverId(null)}
                  >
                    <span className={cn('size-2.5 shrink-0 rounded-sm', seg.dot)} />
                    <span>
                      {seg.label}: <strong className="font-semibold text-foreground">{seg.count}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="flex h-[380px] flex-col rounded-xl border border-border bg-card p-5 shadow-sm lg:p-6">
          <div className="mb-3 shrink-0">
            <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Stay up to date with what&apos;s happening across the space.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            {todayActivity.length > 0 ? (
              <>
                <div className="mb-2.5 sticky top-0 z-10 bg-card pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Today
                </div>
                <ActivityList items={todayActivity} />
              </>
            ) : null}
            {olderActivity.length > 0 ? (
              <div className={cn(todayActivity.length > 0 && 'mt-5')}>
                {todayActivity.length > 0 ? (
                  <div className="mb-2.5 sticky top-0 z-10 bg-card text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Earlier
                  </div>
                ) : null}
                <ActivityList items={olderActivity} />
              </div>
            ) : null}
            {activity.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No activity in this project yet.</p>
            ) : null}
          </div>
        </article>

        <article className="flex min-h-[340px] flex-col rounded-xl border border-border bg-card p-5 shadow-sm lg:p-6">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">Priority breakdown</h2>
            <p className="mt-0.5 text-xs leading-normal text-muted-foreground">
              Get a holistic view of how work is being prioritized.
            </p>
          </div>
          <div className="mt-6 pt-1">
            <div className="relative flex flex-col">
              <div className="relative flex h-36 flex-col justify-between">
                {yTicks.map((tick) => (
                  <div key={tick} className="flex w-full items-center gap-2">
                    <span className="w-3 text-right text-[11px] font-medium text-muted-foreground">{tick}</span>
                    <div className={cn('h-px flex-1', tick === 0 ? 'bg-border' : 'bg-secondary')} />
                  </div>
                ))}
                <div className="absolute inset-0 flex items-end justify-between pb-px pl-5 pr-2">
                  {priorityOrder.map((priority) => {
                    const count = issues.filter((i) => i.priority === priority).length
                    const height = `${(count / yMax) * 100}%`
                    return (
                      <div key={priority} className="flex h-full flex-1 items-end justify-center px-1">
                        <div
                          className="w-full max-w-[40px] rounded-t bg-muted-foreground/70 transition-all duration-300 hover:bg-muted-foreground"
                          style={{ height: count === 0 ? 0 : height }}
                          title={`${priority}: ${count}`}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between pl-5 pr-2 pt-2.5 text-[11px] text-muted-foreground">
                {priorityOrder.map((priority) => (
                  <div key={priority} className="flex flex-1 items-center justify-center gap-1 text-center capitalize">
                    <PriorityIcon priority={priority} />
                    <span className="truncate text-[10px] sm:text-[11px]">{priority}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="flex min-h-[340px] flex-col rounded-xl border border-border bg-card p-5 shadow-sm lg:p-6">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">Types of work</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Get a breakdown of work items by their types.
              <Link href="/issues" className="ml-1 inline font-medium text-foreground hover:underline">
                View all items
              </Link>
            </p>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-2 pt-2 text-xs font-semibold text-muted-foreground">
            <span>Type</span>
            <span>Distribution</span>
          </div>
          <div className="space-y-4 pt-3.5">
            {typeEntries.map(({ type, pct, icon: Icon, className, label }) => (
              <div key={type} className="flex items-center justify-between gap-4">
                <div className="flex w-28 shrink-0 items-center gap-2 text-xs font-medium text-foreground">
                  <Icon className={cn('size-3.5', className)} />
                  <span>{label}</span>
                </div>
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex h-6 w-full items-center overflow-hidden rounded bg-secondary px-2.5">
                    <div
                      className="absolute inset-y-0 left-0 rounded-l bg-muted-foreground/25 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                    <span
                      className={cn(
                        'relative z-10 text-xs font-semibold',
                        pct === 0 ? 'text-muted-foreground' : 'text-foreground',
                      )}
                    >
                      {pct > 0 ? `${pct}%` : null}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
