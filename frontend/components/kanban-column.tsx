'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Column, Issue, User } from '@/lib/types'
import { TaskCard } from '@/components/task-card'
import { columnDot } from '@/lib/issue-meta'

export function KanbanColumn({
  column,
  index,
  tasks,
  usersById,
  canAdd,
  onAdd,
  onDropIssue,
}: {
  column: Column
  index: number
  tasks: Issue[]
  usersById: Record<string, User>
  canAdd: boolean
  onAdd: () => void
  onDropIssue: (issueId: string, columnId: string) => void
}) {
  return (
    <section
      className="flex w-72 shrink-0 flex-col rounded-xl bg-secondary/60 lg:w-auto lg:flex-1"
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(event) => {
        event.preventDefault()
        const id = event.dataTransfer.getData('text/issue-id') || event.dataTransfer.getData('text/plain')
        if (id) onDropIssue(id, column.id)
      }}
    >
      <header className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', columnDot(column.id, index))} aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
          <span className="rounded-full bg-background px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          title={!canAdd ? 'Guests have view-only access' : `Add task to ${column.title}`}
          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Add task to ${column.title}`}
        >
          <Plus className="size-4" />
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-2.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} assignee={usersById[task.assigneeId]} draggable={canAdd} />
        ))}
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          title={!canAdd ? 'Guests have view-only access' : undefined}
          className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-3.5" />
          Add task
        </button>
      </div>
    </section>
  )
}
