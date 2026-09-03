'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Paperclip, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatDate, formatRelative } from '@/lib/format'
import { inputClass, selectClass, typeConfig } from '@/lib/issue-meta'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'
import type { Priority, TaskType } from '@/lib/types'

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const store = useStore()
  const issue = store.issues.find((i) => i.id === id)
  const [comment, setComment] = useState('')
  const [subtask, setSubtask] = useState('')
  const [fileName, setFileName] = useState('')

  const project = store.projects.find((p) => p.id === issue?.projectId)
  const canEdit = store.can('edit_issue')
  const canComment = store.can('comment')

  const comments = useMemo(
    () => store.comments.filter((c) => c.issueId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [store.comments, id],
  )
  const activity = useMemo(
    () => store.activities.filter((a) => a.issueId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [store.activities, id],
  )

  if (!issue || !project || !store.visibleProjects.some((item) => item.id === issue.projectId)) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="Issue not found"
          description="This id is missing from the mock store. It may have been deleted."
          action={
            <Button variant="outline" onClick={() => router.push('/issues')}>
              Back to issues
            </Button>
          }
        />
      </div>
    )
  }

  const members = project.members.map((m) => store.usersById[m.userId]).filter(Boolean)
  const sprints = store.sprints.filter((s) => s.projectId === project.id)
  const TypeIcon = typeConfig[issue.type].icon

  return (
    <>
      <PageHeader
        breadcrumb={
          <>
            <Link href="/projects" className="hover:text-foreground">
              Projects
            </Link>
            <span aria-hidden>/</span>
            <span>{project.name}</span>
            <span aria-hidden>/</span>
            <span className="font-mono font-medium text-foreground">{issue.id}</span>
          </>
        }
        title={issue.title}
        actions={
          store.can('delete_issue') ? (
            <Button
              variant="destructive"
              onClick={() => {
                store.deleteIssue(issue.id)
                router.push('/issues')
              }}
            >
              Delete
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_18rem] lg:px-8">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <TypeIcon className={cn('size-4', typeConfig[issue.type].className)} />
              {typeConfig[issue.type].label}
            </div>
            {canEdit ? (
              <textarea
                className={`${inputClass} h-32 py-2`}
                value={issue.description}
                onChange={(e) => store.updateIssue(issue.id, { description: e.target.value })}
              />
            ) : (
              <p className="text-pretty text-sm leading-relaxed text-foreground">
                {issue.description || 'No description.'}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Subtasks</h2>
            <ul className="mt-3 space-y-2">
              {issue.subtasks.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.done}
                      disabled={!canEdit}
                      onChange={() => store.toggleSubtask(issue.id, item.id)}
                    />
                    <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            {issue.subtasks.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No subtasks yet.</p>
            ) : null}
            {canEdit ? (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  store.addSubtask(issue.id, subtask)
                  setSubtask('')
                }}
              >
                <input
                  className={inputClass}
                  value={subtask}
                  onChange={(e) => setSubtask(e.target.value)}
                  placeholder="Add a subtask"
                />
                <Button type="submit" variant="outline" disabled={!subtask.trim()}>
                  <Plus className="size-4" />
                </Button>
              </form>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Files</h2>
            <p className="mt-1 text-xs text-muted-foreground">Mock attachments only — nothing is uploaded.</p>
            <ul className="mt-3 space-y-2">
              {issue.attachments.map((file) => (
                <li key={file.id} className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                  <Paperclip className="size-4 text-muted-foreground" />
                  <span className="flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{file.size}</span>
                </li>
              ))}
            </ul>
            {issue.attachments.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No files attached.</p>
            ) : null}
            {canEdit ? (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  store.addAttachment(issue.id, fileName)
                  setFileName('')
                }}
              >
                <input
                  className={inputClass}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="notes.pdf"
                />
                <Button type="submit" variant="outline" disabled={!fileName.trim()}>
                  Attach
                </Button>
              </form>
            ) : null}
          </section>

          {issue.blockedBy.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Blocked by</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {issue.blockedBy.map((blocked) => (
                  <Link
                    key={blocked}
                    href={`/issues/${blocked}`}
                    className="rounded-md bg-secondary px-2 py-1 font-mono text-xs font-semibold"
                  >
                    {blocked}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Comments</h2>
            {canComment ? (
              <form
                className="mt-3 grid gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  store.addComment(issue.id, comment)
                  setComment('')
                }}
              >
                <textarea
                  className={`${inputClass} h-20 py-2`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment"
                />
                <div>
                  <Button type="submit" disabled={!comment.trim()}>
                    Comment
                  </Button>
                </div>
              </form>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Guests can read comments but cannot post.</p>
            )}
            <ul className="mt-4 space-y-4">
              {comments.map((item) => {
                const author = store.usersById[item.authorId]
                return (
                  <li key={item.id} className="flex gap-3">
                    {author ? <UserAvatar member={author} /> : null}
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{author?.name}</span>{' '}
                        <span className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</span>
                      </p>
                      <p className="mt-1 text-sm text-pretty">{item.body}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
            {comments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No comments yet.</p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Details</h2>
            <div className="grid gap-3 text-sm">
              <Field label="Status">
                <select
                  className={selectClass}
                  value={issue.column}
                  disabled={!canEdit}
                  onChange={(e) => store.moveIssue(issue.id, e.target.value)}
                >
                  {project.columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Assignee">
                <select
                  className={selectClass}
                  value={issue.assigneeId}
                  disabled={!canEdit}
                  onChange={(e) => store.updateIssue(issue.id, { assigneeId: e.target.value })}
                >
                  {members.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  className={selectClass}
                  value={issue.priority}
                  disabled={!canEdit}
                  onChange={(e) => store.updateIssue(issue.id, { priority: e.target.value as Priority })}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </Field>
              <Field label="Type">
                <select
                  className={selectClass}
                  value={issue.type}
                  disabled={!canEdit}
                  onChange={(e) => store.updateIssue(issue.id, { type: e.target.value as TaskType })}
                >
                  <option value="task">Task</option>
                  <option value="feature">Feature</option>
                  <option value="bug">Bug</option>
                  <option value="improvement">Improvement</option>
                </select>
              </Field>
              <Field label="Label">
                <select
                  className={selectClass}
                  value={issue.tag}
                  disabled={!canEdit}
                  onChange={(e) => store.updateIssue(issue.id, { tag: e.target.value })}
                >
                  {project.labels.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sprint">
                <select
                  className={selectClass}
                  value={issue.sprintId ?? ''}
                  disabled={!canEdit}
                  onChange={(e) => store.updateIssue(issue.id, { sprintId: e.target.value || null })}
                >
                  <option value="">Backlog</option>
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  className={inputClass}
                  value={issue.dueDate ?? ''}
                  disabled={!canEdit}
                  onChange={(e) => store.updateIssue(issue.id, { dueDate: e.target.value || null })}
                />
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(issue.dueDate)}</p>
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Activity</h2>
            <ul className="mt-3 space-y-3">
              {activity.map((item) => {
                const actor = store.usersById[item.actorId]
                return (
                  <li key={item.id} className="text-sm">
                    <span className="font-medium">{actor?.name}</span>{' '}
                    <span className="text-muted-foreground">{item.message}</span>
                    <div className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</div>
                  </li>
                )
              })}
            </ul>
          </section>
        </aside>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
      <div className="font-medium normal-case tracking-normal">{children}</div>
    </label>
  )
}
