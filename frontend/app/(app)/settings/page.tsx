'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { inputClass, selectClass } from '@/lib/issue-meta'
import { defaultPrefs } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'

const tabs = ['Account', 'Project', 'Workspace'] as const

export default function SettingsPage() {
  const store = useStore()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Account')
  const project = store.currentProject
  const prefs = (store.currentUserId && store.accountPrefs[store.currentUserId]) || defaultPrefs
  const [label, setLabel] = useState('')
  const [columnTitle, setColumnTitle] = useState('')
  const [sprintName, setSprintName] = useState('')
  const [sprintStart, setSprintStart] = useState('2026-09-08')
  const [sprintEnd, setSprintEnd] = useState('2026-09-21')
  const [inviteId, setInviteId] = useState('')

  const workspaceUsersNotInProject =
    project?.members
      ? store.users.filter((u) => !project.members.some((m) => m.userId === u.id))
      : []

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
      />

      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                tab === item ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
        {tab === 'Account' && store.currentUser ? (
          <div className="space-y-6 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <UserAvatar member={store.currentUser} size="md" />
              <div>
                <p className="text-sm font-medium">{store.currentUser.email}</p>
                <p className="text-xs capitalize text-muted-foreground">{store.role}</p>
              </div>
            </div>
            <label className="grid gap-1.5 text-sm font-medium">
              Display name
              <input
                className={inputClass}
                value={store.currentUser.name}
                onChange={(e) => store.updateUserProfile({ name: e.target.value })}
              />
            </label>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Email notifications</legend>
              <Toggle
                label="Assigned to me"
                checked={prefs.notifyAssigned}
                onChange={(v) => store.updateAccountPrefs({ notifyAssigned: v })}
              />
              <Toggle
                label="Comments on my issues"
                checked={prefs.notifyComments}
                onChange={(v) => store.updateAccountPrefs({ notifyComments: v })}
              />
              <Toggle
                label="Status changes"
                checked={prefs.notifyStatus}
                onChange={(v) => store.updateAccountPrefs({ notifyStatus: v })}
              />
            </fieldset>
          </div>
        ) : null}

        {tab === 'Project' && project ? (
          <div className="space-y-6">
            <section className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Project</h2>
              <label className="grid gap-1.5 text-sm font-medium">
                Name
                <input
                  className={inputClass}
                  value={project.name}
                  disabled={!store.can('edit_project')}
                  onChange={(e) => store.updateProject(project.id, { name: e.target.value })}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Key
                <input
                  className={inputClass}
                  value={project.key}
                  maxLength={5}
                  disabled={!store.can('edit_project')}
                  onChange={(e) => store.updateProject(project.id, { key: e.target.value.toUpperCase() })}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Description
                <textarea
                  className={`${inputClass} h-20 py-2`}
                  value={project.description}
                  disabled={!store.can('edit_project')}
                  onChange={(e) => store.updateProject(project.id, { description: e.target.value })}
                />
              </label>
              {store.can('delete_project') ? (
                <Button
                  variant="destructive"
                  disabled={store.projects.length <= 1}
                  title={store.projects.length <= 1 ? 'Keep at least one project' : undefined}
                  onClick={() => store.deleteProject(project.id)}
                >
                  Delete project
                </Button>
              ) : null}
            </section>

            <section className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Labels</h2>
              <div className="flex flex-wrap gap-2">
                {project.labels.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={!store.can('edit_project')}
                    onClick={() => store.removeLabel(project.id, item)}
                    className="rounded-md bg-secondary px-2 py-1 text-xs font-medium disabled:opacity-50"
                    title={store.can('edit_project') ? 'Remove label' : undefined}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {store.can('edit_project') ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    store.addLabel(project.id, label)
                    setLabel('')
                  }}
                >
                  <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="New label" />
                  <Button type="submit" variant="outline">
                    Add
                  </Button>
                </form>
              ) : null}
            </section>

            <section className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Workflow columns</h2>
              <ul className="space-y-2">
                {project.columns.map((column) => (
                  <li key={column.id} className="flex gap-2">
                    <input
                      className={inputClass}
                      value={column.title}
                      disabled={!store.can('edit_project')}
                      onChange={(e) => store.updateColumn(project.id, column.id, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      disabled={!store.can('edit_project') || project.columns.length <= 1}
                      onClick={() => store.removeColumn(project.id, column.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
              {store.can('edit_project') ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    store.addColumn(project.id, columnTitle)
                    setColumnTitle('')
                  }}
                >
                  <input
                    className={inputClass}
                    value={columnTitle}
                    onChange={(e) => setColumnTitle(e.target.value)}
                    placeholder="Column title"
                  />
                  <Button type="submit" variant="outline">
                    Add column
                  </Button>
                </form>
              ) : null}
            </section>

            <section className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Sprints</h2>
              <ul className="space-y-2">
                {store.sprints
                  .filter((s) => s.projectId === project.id)
                  .map((sprint) => (
                    <li key={sprint.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                      <span>
                        {sprint.name}{' '}
                        <span className="text-muted-foreground">
                          {sprint.startDate} → {sprint.endDate} · {sprint.status}
                        </span>
                      </span>
                      {store.can('manage_sprints') && sprint.status !== 'closed' ? (
                        <Button variant="outline" size="sm" onClick={() => store.closeSprint(sprint.id)}>
                          Close
                        </Button>
                      ) : null}
                    </li>
                  ))}
              </ul>
              {store.can('manage_sprints') ? (
                <form
                  className="grid gap-2 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    store.createSprint({ name: sprintName, startDate: sprintStart, endDate: sprintEnd })
                    setSprintName('')
                  }}
                >
                  <input
                    className={inputClass}
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    placeholder="Sprint name"
                  />
                  <input className={inputClass} type="date" value={sprintStart} onChange={(e) => setSprintStart(e.target.value)} />
                  <input className={inputClass} type="date" value={sprintEnd} onChange={(e) => setSprintEnd(e.target.value)} />
                  <Button type="submit" variant="outline" className="sm:col-span-3" disabled={!sprintName.trim()}>
                    Create sprint
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">Only admins can create or close sprints.</p>
              )}
            </section>

            <section className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Members</h2>
              <ul className="space-y-2">
                {project.members.map((member) => {
                  const user = store.usersById[member.userId]
                  if (!user) return null
                  return (
                    <li key={member.userId} className="flex items-center gap-3">
                      <UserAvatar member={user} />
                      <span className="min-w-0 flex-1 text-sm">
                        {user.name}
                        <span className="block text-xs text-muted-foreground">{user.email}</span>
                      </span>
                      <select
                        className={`${selectClass} w-28`}
                        value={member.role}
                        disabled={!store.can('manage_members')}
                        onChange={(e) => store.updateProjectMember(project.id, member.userId, e.target.value as Role)}
                      >
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="guest">guest</option>
                      </select>
                      {store.can('manage_members') ? (
                        <Button variant="ghost" onClick={() => store.removeProjectMember(project.id, member.userId)}>
                          Remove
                        </Button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
              {store.can('manage_members') ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!inviteId) return
                    store.addProjectMember(project.id, inviteId, 'member')
                    setInviteId('')
                  }}
                >
                  <select className={selectClass} value={inviteId} onChange={(e) => setInviteId(e.target.value)}>
                    <option value="">Invite someone…</option>
                    {workspaceUsersNotInProject.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" disabled={!inviteId}>
                    Invite
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">You can view members but cannot invite people.</p>
              )}
            </section>
          </div>
        ) : null}

        {tab === 'Workspace' ? (
          <div className="space-y-6">
            <section className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Workspace</h2>
              <label className="grid gap-1.5 text-sm font-medium">
                Name
                <input
                  className={inputClass}
                  value={store.workspace.name}
                  disabled={!store.can('manage_workspace')}
                  onChange={(e) => store.updateWorkspace({ name: e.target.value })}
                />
              </label>
              <ul className="space-y-2">
                {store.workspace.members.map((member) => {
                  const user = store.usersById[member.userId]
                  if (!user) return null
                  return (
                    <li key={member.userId} className="flex items-center gap-3">
                      <UserAvatar member={user} />
                      <span className="min-w-0 flex-1 text-sm">
                        {user.name}
                        <span className="block text-xs text-muted-foreground">{user.email}</span>
                      </span>
                      <select
                        className={`${selectClass} w-28`}
                        value={member.role}
                        disabled={!store.can('manage_workspace') || member.userId === store.currentUserId}
                        onChange={(e) => store.updateWorkspaceMember(member.userId, e.target.value as Role)}
                      >
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="guest">guest</option>
                      </select>
                    </li>
                  )
                })}
              </ul>
            </section>
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Demo data</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Reset restores the original mock workspace. Your current login stays signed in.
              </p>
              <Button className="mt-3" variant="outline" onClick={() => store.resetDemo()}>
                Reset demo data
              </Button>
            </section>
          </div>
        ) : null}
      </div>
    </>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}
