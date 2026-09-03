'use client'

import { KanbanColumn } from '@/components/kanban-column'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import type { Issue } from '@/lib/types'

export function KanbanBoard({ issues }: { issues: Issue[] }) {
  const store = useStore()
  const columns = store.currentProject?.columns ?? []
  const canAdd = store.can('create_issue')

  if (columns.length === 0) {
    return (
      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        <EmptyState title="No columns" description="Add a workflow column in project settings." />
      </div>
    )
  }

  if (issues.length === 0) {
    return (
      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        <EmptyState
          title="No issues in this view"
          description="Try another sprint or filter, or create the first task for this project."
          action={
            canAdd ? (
              <Button onClick={() => store.openComposer()}>Add New Task</Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-6 sm:px-6 lg:px-8">
      {columns.map((column, index) => (
        <KanbanColumn
          key={column.id}
          column={column}
          index={index}
          tasks={issues.filter((task) => task.column === column.id)}
          usersById={store.usersById}
          canAdd={canAdd}
          onAdd={() => store.openComposer(column.id)}
          onDropIssue={(issueId, columnId) => store.moveIssue(issueId, columnId)}
        />
      ))}
    </div>
  )
}
