'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { typeConfig } from '@/lib/issue-meta'
import type { Issue, User } from '@/lib/types'
import { PriorityIcon } from '@/components/priority-icon'
import { UserAvatar } from '@/components/user-avatar'
import { formatDate, isOverdue } from '@/lib/format'

export function IssueTable({
  issues,
  usersById,
  columns,
  empty,
}: {
  issues: Issue[]
  usersById: Record<string, User>
  columns: { id: string; title: string }[]
  empty?: ReactNode
}) {
  if (issues.length === 0) return <>{empty}</>

  const columnTitle = Object.fromEntries(columns.map((c) => [c.id, c.title]))

  return (
    <div className="overflow-x-auto px-4 pb-8 sm:px-6 lg:px-8">
      <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="border-b border-border px-3 py-2.5 font-semibold">Issue</th>
            <th className="border-b border-border px-3 py-2.5 font-semibold">Status</th>
            <th className="border-b border-border px-3 py-2.5 font-semibold">Priority</th>
            <th className="border-b border-border px-3 py-2.5 font-semibold">Assignee</th>
            <th className="border-b border-border px-3 py-2.5 font-semibold">Due</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const TypeIcon = typeConfig[issue.type].icon
            const assignee = usersById[issue.assigneeId]
            const overdue = isOverdue(issue.dueDate, issue.column)
            return (
              <tr key={issue.id} className="hover:bg-muted/60">
                <td className="border-b border-border px-3 py-2.5">
                  <Link href={`/issues/${issue.id}`} className="flex items-start gap-2">
                    <TypeIcon className={cn('mt-0.5 size-4 shrink-0', typeConfig[issue.type].className)} />
                    <span>
                      <span className="block font-medium text-foreground">{issue.title}</span>
                      <span className="font-mono text-xs font-semibold text-muted-foreground">{issue.id}</span>
                    </span>
                  </Link>
                </td>
                <td className="border-b border-border px-3 py-2.5 text-muted-foreground">
                  {columnTitle[issue.column] ?? issue.column}
                </td>
                <td className="border-b border-border px-3 py-2.5">
                  <PriorityIcon priority={issue.priority} />
                </td>
                <td className="border-b border-border px-3 py-2.5">
                  {assignee ? (
                    <span className="inline-flex items-center gap-2">
                      <UserAvatar member={assignee} />
                      <span className="text-foreground">{assignee.name}</span>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={cn('border-b border-border px-3 py-2.5', overdue && 'font-medium text-chart-4')}>
                  {formatDate(issue.dueDate)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
