'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { inputClass } from '@/lib/issue-meta'

export default function ProjectsPage() {
  const store = useStore()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const canCreate = store.can('create_project')

  function create() {
    const id = store.createProject({ name, key, description })
    setOpen(false)
    setName('')
    setKey('')
    setDescription('')
    if (id) router.push('/board')
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <>
            <span>Workspace</span>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">{store.workspace.name}</span>
          </>
        }
        actions={
          <Button
            size="lg"
            disabled={!canCreate}
            title={!canCreate ? "You don't have permission for this action" : undefined}
            onClick={() => setOpen(true)}
          >
            <Plus className="size-4" />
            New Project
          </Button>
        }
      />

      <div className="px-4 py-5 sm:px-6 lg:px-8">
        {store.visibleProjects.length === 0 ? (
          <EmptyState
            title="No projects"
            description="You are not a member of any project yet."
            action={
              canCreate ? (
                <Button onClick={() => setOpen(true)}>New Project</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {store.visibleProjects.map((project) => {
              const count = store.issues.filter((i) => i.projectId === project.id).length
              const members = project.members
                .map((m) => store.usersById[m.userId])
                .filter(Boolean)
                .slice(0, 5)
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    store.selectProject(project.id)
                    router.push('/board')
                  }}
                  className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-md bg-chart-5/15 text-xs font-bold text-chart-5">
                      {project.key}
                    </span>
                    <span className="text-xs text-muted-foreground">{count} issues</span>
                  </div>
                  <h2 className="mt-3 text-sm font-semibold">{project.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                  <div className="mt-4 flex -space-x-1.5">
                    {members.map((user) => (
                      <UserAvatar key={user.id} member={user} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Dialog
        open={open}
        title="New project"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={!name.trim()}>
              Create
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Name
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mobile Web" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Key
            <input
              className={inputClass}
              value={key}
              maxLength={5}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="MW"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Description
            <textarea
              className={`${inputClass} h-20 py-2`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
      </Dialog>
    </>
  )
}
