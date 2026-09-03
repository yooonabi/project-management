'use client'

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { applyIssueQuery } from '@/lib/issue-filters'
import { isOverdue, startOfWeek, formatRelative } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Clock, CircleDot } from 'lucide-react'

export default function DashboardPage() {
  const store = useStore()
  const project = store.currentProject
  const issues = store.issues.filter((i) => i.projectId === store.currentProjectId)
  const doneId = project?.columns.find((c) => c.id === 'done' || c.title.toLowerCase() === 'done')?.id ?? 'done'
  const weekStart = startOfWeek().getTime()
  const mine = applyIssueQuery(issues, { mine: true }, { currentUserId: store.currentUserId })
  const openBugs = applyIssueQuery(issues, { openBugs: true }, { currentUserId: store.currentUserId, doneColumnId: doneId })
  const overdue = issues.filter((i) => isOverdue(i.dueDate, i.column, doneId))
  const doneWeek = issues.filter((i) => i.column === doneId && new Date(i.updatedAt).getTime() >= weekStart)
  const open = issues.filter((i) => i.column !== doneId)

  const byType = {
    bug: issues.filter((i) => i.type === 'bug').length,
    feature: issues.filter((i) => i.type === 'feature').length,
    task: issues.filter((i) => i.type === 'task').length,
    improvement: issues.filter((i) => i.type === 'improvement').length,
  }
  const typeTotal = Math.max(1, issues.length)

  const activity = store.activities
    .filter((a) => issues.some((i) => i.id === a.issueId))
    .slice(0, 8)

  const stats = [
    { href: '/issues?filter=mine', label: 'Assigned to me', value: mine.length, icon: CircleDot },
    { href: '/issues?filter=open', label: 'Open issues', value: open.length, icon: Clock },
    { href: '/issues?filter=done-week', label: 'Done this week', value: doneWeek.length, icon: CheckCircle2 },
    { href: '/issues?filter=bugs', label: 'Open bugs', value: openBugs.length, icon: AlertCircle },
    { href: '/issues?filter=overdue', label: 'Overdue', value: overdue.length, icon: AlertCircle, warn: overdue.length > 0 },
  ]

  return (
    <>
      <PageHeader
        breadcrumb={
          <>
            <span>Workspace</span>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">{project?.name ?? 'Project'}</span>
          </>
        }
      />

      <div className="grid gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <stat.icon className="size-3.5" />
              {stat.label}
            </p>
            <p className={cn('mt-2 text-2xl font-semibold tracking-tight', stat.warn && 'text-chart-4')}>
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Status</h2>
          <div className="mt-3 space-y-2">
            {(project?.columns ?? []).map((column) => {
              const count = issues.filter((i) => i.column === column.id).length
              const pct = Math.round((count / Math.max(1, issues.length)) * 100)
              return (
                <Link key={column.id} href={`/issues?column=${column.id}`} className="block">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-foreground">{column.title}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Issue mix</h2>
          <p className="mt-1 text-xs text-muted-foreground">Bug vs feature vs other work in this project.</p>
          <div className="mt-4 space-y-2">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3 text-sm">
                <span className="w-24 capitalize text-muted-foreground">{type}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(count / typeTotal) * 100}%` }} />
                </div>
                <span className="w-6 text-right font-medium">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No activity in this project yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {activity.map((item) => {
                const actor = store.usersById[item.actorId]
                return (
                  <li key={item.id}>
                    <Link href={`/issues/${item.issueId}`} className="flex items-center gap-3 py-2.5 hover:bg-muted/40">
                      {actor ? <UserAvatar member={actor} /> : null}
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="font-medium">{actor?.name ?? 'Someone'}</span>{' '}
                        <span className="text-muted-foreground">{item.message}</span>{' '}
                        <span className="font-mono text-xs font-semibold">{item.issueId}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(item.createdAt)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
