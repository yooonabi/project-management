'use client'

import { useMemo, useState } from 'react'
import { ListFilter, Users, Columns3, List } from 'lucide-react'
import { useStore } from '@/lib/store'
import { applyIssueQuery, type IssueQuery } from '@/lib/issue-filters'
import { PageHeader } from '@/components/page-header'
import { KanbanBoard } from '@/components/kanban-board'
import { IssueTable } from '@/components/issue-table'
import { EmptyState } from '@/components/empty-state'
import { cn } from '@/lib/utils'

export default function BoardPage() {
  const store = useStore()
  const project = store.currentProject
  const [view, setView] = useState<'board' | 'list'>('board')
  const [sprint, setSprint] = useState<'active' | 'backlog' | string>('active')
  const [query, setQuery] = useState<IssueQuery>({})
  const [filterOpen, setFilterOpen] = useState(false)
  const [assigneeOpen, setAssigneeOpen] = useState(false)

  const projectSprints = store.sprints.filter((s) => s.projectId === store.currentProjectId)
  const activeSprint = projectSprints.find((s) => s.status === 'active')
  const members = (project?.members ?? []).map((m) => store.usersById[m.userId]).filter(Boolean)

  const issues = useMemo(() => {
    const all = store.issues.filter((i) => i.projectId === store.currentProjectId)
    let sprintId: string | undefined
    if (sprint === 'active') sprintId = activeSprint?.id
    else if (sprint === 'backlog') sprintId = 'backlog'
    else sprintId = sprint
    return applyIssueQuery(
      all,
      { ...query, sprint: sprintId },
      { currentUserId: store.currentUserId },
    )
  }, [store.issues, store.currentProjectId, store.currentUserId, query, sprint, activeSprint?.id])

  if (!project) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState title="No project selected" description="Create or join a project to open the board." />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <>
            <span>Projects</span>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">{project.name}</span>
          </>
        }
        actions={
          <>
            <label className="sr-only" htmlFor="sprint">
              Sprint
            </label>
            <select
              id="sprint"
              value={sprint}
              onChange={(e) => setSprint(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium"
            >
              <option value="active">Active sprint{activeSprint ? ` (${activeSprint.name})` : ''}</option>
              <option value="backlog">Backlog</option>
              {projectSprints.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.status}
                </option>
              ))}
            </select>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setFilterOpen((v) => !v)
                  setAssigneeOpen(false)
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <ListFilter className="size-4" />
                Filter
              </button>
              {filterOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-border bg-card p-2 shadow-lg">
                  <FilterOption
                    active={!query.type && !query.priority}
                    onClick={() => {
                      setQuery({})
                      setFilterOpen(false)
                    }}
                  >
                    All types
                  </FilterOption>
                  {(['bug', 'feature', 'task', 'improvement'] as const).map((type) => (
                    <FilterOption
                      key={type}
                      active={query.type === type}
                      onClick={() => {
                        setQuery((q) => ({ ...q, type }))
                        setFilterOpen(false)
                      }}
                    >
                      {type}
                    </FilterOption>
                  ))}
                  <div className="my-1 border-t border-border" />
                  {(['high', 'medium', 'low'] as const).map((priority) => (
                    <FilterOption
                      key={priority}
                      active={query.priority === priority}
                      onClick={() => {
                        setQuery((q) => ({ ...q, priority }))
                        setFilterOpen(false)
                      }}
                    >
                      {priority} priority
                    </FilterOption>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAssigneeOpen((v) => !v)
                  setFilterOpen(false)
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Users className="size-4" />
                <span className="hidden sm:inline">Assignee</span>
              </button>
              {assigneeOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-border bg-card p-2 shadow-lg">
                  <FilterOption
                    active={!query.assignee}
                    onClick={() => {
                      setQuery((q) => ({ ...q, assignee: undefined }))
                      setAssigneeOpen(false)
                    }}
                  >
                    Anyone
                  </FilterOption>
                  <FilterOption
                    active={query.assignee === 'me'}
                    onClick={() => {
                      setQuery((q) => ({ ...q, assignee: 'me' }))
                      setAssigneeOpen(false)
                    }}
                  >
                    Assigned to me
                  </FilterOption>
                  {members.map((user) => (
                    <FilterOption
                      key={user.id}
                      active={query.assignee === user.id}
                      onClick={() => {
                        setQuery((q) => ({ ...q, assignee: user.id }))
                        setAssigneeOpen(false)
                      }}
                    >
                      {user.name}
                    </FilterOption>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
              <button
                type="button"
                onClick={() => setView('board')}
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-md',
                  view === 'board' ? 'bg-accent' : 'text-muted-foreground hover:text-foreground',
                )}
                aria-label="Board view"
              >
                <Columns3 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-md',
                  view === 'list' ? 'bg-accent' : 'text-muted-foreground hover:text-foreground',
                )}
                aria-label="List view"
              >
                <List className="size-4" />
              </button>
            </div>
          </>
        }
      />

      <div className="pt-5">
        {view === 'board' ? (
          <KanbanBoard issues={issues} />
        ) : (
          <IssueTable
            issues={issues}
            usersById={store.usersById}
            columns={project.columns}
            empty={
              <div className="px-4 pb-8 sm:px-6 lg:px-8">
                <EmptyState title="No issues match" description="Clear filters or add a task to this sprint." />
              </div>
            }
          />
        )}
      </div>
    </>
  )
}

function FilterOption({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'block w-full rounded-lg px-2 py-1.5 text-left text-sm capitalize hover:bg-muted',
        active && 'bg-accent font-medium',
      )}
    >
      {children}
    </button>
  )
}
