'use client'

import { Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { applyIssueQuery, type IssueQuery } from '@/lib/issue-filters'
import { PageHeader } from '@/components/page-header'
import { IssueTable } from '@/components/issue-table'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { selectClass } from '@/lib/issue-meta'
import type { Priority, TaskType } from '@/lib/types'

export default function IssuesPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-sm text-muted-foreground">Loading issues…</div>}>
      <IssuesPageInner />
    </Suspense>
  )
}

function IssuesPageInner() {
  const store = useStore()
  const params = useSearchParams()
  const router = useRouter()
  const project = store.currentProject

  const query = useMemo<IssueQuery>(() => {
    const filter = params.get('filter')
    return {
      q: params.get('q') ?? undefined,
      assignee: params.get('assignee') ?? undefined,
      type: (params.get('type') as TaskType | null) ?? undefined,
      priority: (params.get('priority') as Priority | null) ?? undefined,
      sprint: params.get('sprint') ?? undefined,
      column: params.get('column') ?? undefined,
      mine: filter === 'mine',
      overdue: filter === 'overdue',
      openBugs: filter === 'bugs',
      doneWeek: filter === 'done-week',
    }
  }, [params])

  const issues = useMemo(() => {
    const all = store.issues.filter((i) => i.projectId === store.currentProjectId)
    const openOnly = params.get('filter') === 'open'
    const doneId = project?.columns.find((c) => c.id === 'done')?.id ?? 'done'
    const filtered = applyIssueQuery(all, query, {
      currentUserId: store.currentUserId,
      doneColumnId: doneId,
    })
    return openOnly ? filtered.filter((i) => i.column !== doneId) : filtered
  }, [store.issues, store.currentProjectId, store.currentUserId, query, params, project])

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (!value) next.delete(key)
    else next.set(key, value)
    if (key !== 'filter') next.delete('filter')
    const qs = next.toString()
    router.replace(qs ? `/issues?${qs}` : '/issues')
  }

  const members = (project?.members ?? []).map((m) => store.usersById[m.userId]).filter(Boolean)
  const sprints = store.sprints.filter((s) => s.projectId === store.currentProjectId)

  return (
    <>
      <PageHeader
        breadcrumb={
          <>
            <span>Projects</span>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">{project?.name ?? 'Project'}</span>
          </>
        }
        actions={
          <Button
            size="lg"
            disabled={!store.can('create_issue')}
            title={!store.can('create_issue') ? 'Guests have view-only access' : undefined}
            onClick={() => store.openComposer()}
          >
            Add New Task
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-6 lg:px-8">
        <select
          className={`${selectClass} w-auto`}
          value={params.get('type') ?? ''}
          onChange={(e) => setParam('type', e.target.value)}
        >
          <option value="">All types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="task">Task</option>
          <option value="improvement">Improvement</option>
        </select>
        <select
          className={`${selectClass} w-auto`}
          value={params.get('priority') ?? ''}
          onChange={(e) => setParam('priority', e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className={`${selectClass} w-auto`}
          value={params.get('assignee') ?? ''}
          onChange={(e) => setParam('assignee', e.target.value)}
        >
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          {members.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select
          className={`${selectClass} w-auto`}
          value={params.get('sprint') ?? ''}
          onChange={(e) => setParam('sprint', e.target.value)}
        >
          <option value="">All sprints</option>
          <option value="backlog">Backlog</option>
          {sprints.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </option>
          ))}
        </select>
        <select
          className={`${selectClass} w-auto`}
          value={params.get('column') ?? ''}
          onChange={(e) => setParam('column', e.target.value)}
        >
          <option value="">All statuses</option>
          {(project?.columns ?? []).map((column) => (
            <option key={column.id} value={column.id}>
              {column.title}
            </option>
          ))}
        </select>
      </div>

      <IssueTable
        issues={issues}
        usersById={store.usersById}
        columns={project?.columns ?? []}
        empty={
          <div className="px-4 pb-8 sm:px-6 lg:px-8">
            <EmptyState
              title="No issues found"
              description="Nothing matches these filters in the current project."
            />
          </div>
        }
      />
    </>
  )
}
