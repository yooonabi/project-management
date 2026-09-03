'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Issue, User } from '@/lib/types'
import { typeConfig } from '@/lib/issue-meta'
import { PriorityIcon } from '@/components/priority-icon'
import { UserAvatar } from '@/components/user-avatar'

export function TaskCard({
  task,
  assignee,
  draggable,
}: {
  task: Issue
  assignee?: User
  draggable?: boolean
}) {
  const { icon: TypeIcon, className: typeClass } = typeConfig[task.type]
  const dragged = useRef(false)

  return (
    <Link
      href={`/issues/${task.id}`}
      draggable={draggable}
      onDragStart={(event) => {
        if (!draggable) return
        dragged.current = true
        event.dataTransfer.setData('text/plain', task.id)
        event.dataTransfer.setData('text/issue-id', task.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          dragged.current = false
        }, 0)
      }}
      onClick={(event) => {
        if (dragged.current) event.preventDefault()
      }}
      className="group block cursor-pointer rounded-lg border border-border bg-card p-3.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <article>
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/20 px-1.5 py-0.5 text-xs font-semibold text-foreground">
            {task.tag}
          </span>
          <TypeIcon className={cn('size-4 shrink-0', typeClass)} aria-hidden />
        </div>

        <h3 className="mb-3.5 text-sm font-medium leading-relaxed text-pretty text-card-foreground">{task.title}</h3>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold tracking-tight text-muted-foreground">{task.id}</span>
            <PriorityIcon priority={task.priority} />
          </div>
          {assignee ? <UserAvatar member={assignee} /> : null}
        </div>
      </article>
    </Link>
  )
}
