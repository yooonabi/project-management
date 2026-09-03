'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/dialog'
import { inputClass, selectClass } from '@/lib/issue-meta'
import { useStore } from '@/lib/store'
import type { Priority, TaskType } from '@/lib/types'

export function IssueComposer() {
  const store = useStore()
  const project = store.currentProject
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('task')
  const [priority, setPriority] = useState<Priority>('medium')
  const [tag, setTag] = useState(project?.labels[0] ?? '')
  const [assigneeId, setAssigneeId] = useState(store.currentUserId ?? '')
  const [sprintId, setSprintId] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (!store.composer.open || !project) return
    setTag(project.labels[0] ?? '')
    setAssigneeId(store.currentUserId ?? '')
    setSprintId('')
    setDueDate('')
    setType('task')
    setPriority('medium')
  }, [store.composer.open, project, store.currentUserId])

  if (!project) return null
  const currentProject = project

  const sprints = store.sprints.filter((s) => s.projectId === currentProject.id && s.status !== 'closed')
  const members = currentProject.members
    .map((m) => store.usersById[m.userId])
    .filter((user) => Boolean(user))

  function handleOpenChange(open: boolean) {
    if (!open) {
      store.closeComposer()
      setTitle('')
      setDescription('')
    }
  }

  function submit() {
    if (!title.trim() || !store.can('create_issue')) return
    store.createIssue({
      title,
      description,
      type,
      priority,
      tag: tag || currentProject.labels[0],
      assigneeId: assigneeId || store.currentUserId || undefined,
      column: store.composer.columnId ?? currentProject.columns[0]?.id,
      sprintId: sprintId || null,
      dueDate: dueDate || null,
    })
    setTitle('')
    setDescription('')
  }

  return (
    <Dialog
      open={store.composer.open}
      title="Add new task"
      onClose={() => handleOpenChange(false)}
      footer={
        <>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!title.trim() || !store.can('create_issue')}>
            Create task
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm font-medium">
          Title
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Description
          <textarea
            className={`${inputClass} h-24 py-2`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional context"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Type
            <select className={selectClass} value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              <option value="task">Task</option>
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="improvement">Improvement</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Priority
            <select className={selectClass} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Label
            <select className={selectClass} value={tag} onChange={(e) => setTag(e.target.value)}>
              {currentProject.labels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Assignee
            <select className={selectClass} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              {members.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Sprint
            <select className={selectClass} value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
              <option value="">Backlog</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Due date
            <input className={inputClass} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
      </div>
    </Dialog>
  )
}
