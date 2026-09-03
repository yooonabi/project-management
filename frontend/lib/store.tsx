'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { nid } from '@/lib/format'
import { createInitialState, defaultColumns, defaultPrefs, STORAGE_VERSION } from '@/lib/mock-data'
import { can as canRole, type Action } from '@/lib/permissions'
import type {
  AccountPrefs,
  AppState,
  Column,
  Issue,
  Membership,
  Priority,
  Project,
  Role,
  Sprint,
  SprintStatus,
  TaskType,
  User,
} from '@/lib/types'

const STORAGE_KEY = 'flowboard-mock-v1'

type IssuePatch = Partial<
  Pick<
    Issue,
    | 'title'
    | 'description'
    | 'priority'
    | 'type'
    | 'column'
    | 'tag'
    | 'assigneeId'
    | 'dueDate'
    | 'sprintId'
    | 'blockedBy'
    | 'subtasks'
    | 'attachments'
  >
>

type CreateIssueInput = {
  title: string
  description?: string
  priority?: Priority
  type?: TaskType
  column?: string
  tag?: string
  assigneeId?: string
  dueDate?: string | null
  sprintId?: string | null
  projectId?: string
}

export type StoreValue = {
  hydrated: boolean
  currentUser: User | null
  currentProject: Project | undefined
  role: Role | null
  usersById: Record<string, User>
  visibleProjects: Project[]
  can: (action: Action) => boolean
  login: (userId: string) => void
  logout: () => void
  selectProject: (projectId: string) => void
  resetDemo: () => void
  openComposer: (columnId?: string | null) => void
  closeComposer: () => void
  createProject: (input: { name: string; key: string; description: string }) => string | null
  updateProject: (projectId: string, patch: Partial<Pick<Project, 'name' | 'key' | 'description' | 'labels' | 'columns'>>) => void
  deleteProject: (projectId: string) => boolean
  addProjectMember: (projectId: string, userId: string, role: Role) => void
  updateProjectMember: (projectId: string, userId: string, role: Role) => void
  removeProjectMember: (projectId: string, userId: string) => void
  addWorkspaceMember: (userId: string, role: Role) => void
  updateWorkspaceMember: (userId: string, role: Role) => void
  updateWorkspace: (patch: Partial<Pick<WorkspaceName, 'name'>>) => void
  createIssue: (input: CreateIssueInput) => string | null
  updateIssue: (issueId: string, patch: IssuePatch) => void
  moveIssue: (issueId: string, column: string) => void
  deleteIssue: (issueId: string) => void
  addComment: (issueId: string, body: string) => void
  toggleSubtask: (issueId: string, subtaskId: string) => void
  addSubtask: (issueId: string, title: string) => void
  addAttachment: (issueId: string, name: string) => void
  createSprint: (input: { name: string; startDate: string; endDate: string; status?: SprintStatus }) => void
  updateSprint: (sprintId: string, patch: Partial<Pick<Sprint, 'name' | 'status' | 'startDate' | 'endDate'>>) => void
  closeSprint: (sprintId: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  updateAccountPrefs: (patch: Partial<AccountPrefs>) => void
  updateUserProfile: (patch: Partial<Pick<User, 'name'>>) => void
  addLabel: (projectId: string, label: string) => void
  removeLabel: (projectId: string, label: string) => void
  addColumn: (projectId: string, title: string) => void
  updateColumn: (projectId: string, columnId: string, title: string) => void
  removeColumn: (projectId: string, columnId: string) => void
} & AppState

type WorkspaceName = { name: string }

const StoreContext = createContext<StoreValue | null>(null)

function nowIso() {
  return new Date().toISOString()
}

function resolveRole(state: AppState): Role | null {
  if (!state.currentUserId) return null
  const ws = state.workspace.members.find((m) => m.userId === state.currentUserId)
  const project = state.projects.find((p) => p.id === state.currentProjectId)
  const proj = project?.members.find((m) => m.userId === state.currentUserId)
  if (ws?.role === 'owner' || ws?.role === 'admin') return ws.role
  return proj?.role ?? ws?.role ?? null
}

function nextIssueId(issues: Issue[], project: Project) {
  let max = 0
  for (const issue of issues) {
    if (issue.projectId !== project.id) continue
    const n = Number(issue.id.split('-').pop())
    if (!Number.isNaN(n)) max = Math.max(max, n)
  }
  return `${project.key}-${max + 1}`
}

function shouldNotify(state: AppState, userId: string, type: keyof AccountPrefs) {
  const prefs = state.accountPrefs[userId] ?? defaultPrefs
  return prefs[type]
}

function pushActivity(
  state: AppState,
  issueId: string,
  type: AppState['activities'][number]['type'],
  message: string,
): AppState['activities'] {
  if (!state.currentUserId) return state.activities
  return [
    {
      id: nid('a'),
      issueId,
      actorId: state.currentUserId,
      type,
      message,
      createdAt: nowIso(),
    },
    ...state.activities,
  ]
}

function pushNotification(
  state: AppState,
  input: { userId: string; type: AppState['notifications'][number]['type']; issueId: string; message: string },
): AppState['notifications'] {
  if (input.userId === state.currentUserId) return state.notifications
  const prefKey =
    input.type === 'assigned' ? 'notifyAssigned' : input.type === 'comment' ? 'notifyComments' : 'notifyStatus'
  if (!shouldNotify(state, input.userId, prefKey)) return state.notifications
  return [
    {
      id: nid('n'),
      userId: input.userId,
      type: input.type,
      issueId: input.issueId,
      message: input.message,
      read: false,
      createdAt: nowIso(),
    },
    ...state.notifications,
  ]
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(createInitialState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AppState
        if (parsed?.version === STORAGE_VERSION && parsed.users && parsed.issues && parsed.projects && parsed.workspace) {
          setState({
            ...createInitialState(),
            ...parsed,
            composer: { open: false, columnId: null },
          })
        }
      }
    } catch {
      /* use seed data */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const { composer: _composer, ...persistable } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
  }, [state, hydrated])

  const setIfAllowed = useCallback((action: Action, updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      if (!canRole(resolveRole(prev), action)) return prev
      return updater(prev)
    })
  }, [])

  const login = useCallback((userId: string) => {
    setState((prev) => {
      const wsRole = prev.workspace.members.find((m) => m.userId === userId)?.role
      const visible =
        wsRole === 'owner' || wsRole === 'admin'
          ? prev.projects
          : prev.projects.filter((p) => p.members.some((m) => m.userId === userId))
      const currentOk = visible.some((p) => p.id === prev.currentProjectId)
      return {
        ...prev,
        currentUserId: userId,
        currentProjectId: currentOk ? prev.currentProjectId : (visible[0]?.id ?? prev.currentProjectId),
      }
    })
  }, [])

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, currentUserId: null }))
  }, [])

  const selectProject = useCallback((projectId: string) => {
    setState((prev) => ({ ...prev, currentProjectId: projectId }))
  }, [])

  const resetDemo = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(),
      currentUserId: prev.currentUserId,
    }))
  }, [])

  const openComposer = useCallback((columnId?: string | null) => {
    setState((prev) => ({ ...prev, composer: { open: true, columnId: columnId ?? null } }))
  }, [])

  const closeComposer = useCallback(() => {
    setState((prev) => ({ ...prev, composer: { open: false, columnId: null } }))
  }, [])

  const createProject = useCallback((input: { name: string; key: string; description: string }) => {
    let createdId: string | null = null
    setIfAllowed('create_project', (prev) => {
      const key = input.key.trim().toUpperCase().slice(0, 5) || 'PRJ'
      const id = nid('p')
      createdId = id
      const ownerId = prev.currentUserId
      const members: Membership[] = ownerId ? [{ userId: ownerId, role: 'owner' }] : []
      const project: Project = {
        id,
        key,
        name: input.name.trim() || 'Untitled',
        description: input.description.trim(),
        members,
        labels: ['General'],
        columns: structuredClone(defaultColumns),
      }
      return { ...prev, projects: [...prev.projects, project], currentProjectId: id }
    })
    return createdId
  }, [setIfAllowed])

  const updateProject = useCallback(
    (projectId: string, patch: Partial<Pick<Project, 'name' | 'key' | 'description' | 'labels' | 'columns'>>) => {
      setIfAllowed('edit_project', (prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)),
      }))
    },
    [setIfAllowed],
  )

  const deleteProject = useCallback((projectId: string) => {
    let ok = false
    setIfAllowed('delete_project', (prev) => {
      if (prev.projects.length <= 1) return prev
      ok = true
      const remaining = prev.projects.filter((p) => p.id !== projectId)
      return {
        ...prev,
        projects: remaining,
        issues: prev.issues.filter((i) => i.projectId !== projectId),
        sprints: prev.sprints.filter((s) => s.projectId !== projectId),
        currentProjectId: prev.currentProjectId === projectId ? remaining[0].id : prev.currentProjectId,
      }
    })
    return ok
  }, [setIfAllowed])

  const addProjectMember = useCallback((projectId: string, userId: string, role: Role) => {
    setIfAllowed('manage_members', (prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p
        if (p.members.some((m) => m.userId === userId)) {
          return { ...p, members: p.members.map((m) => (m.userId === userId ? { ...m, role } : m)) }
        }
        return { ...p, members: [...p.members, { userId, role }] }
      }),
    }))
  }, [setIfAllowed])

  const updateProjectMember = useCallback((projectId: string, userId: string, role: Role) => {
    setIfAllowed('manage_members', (prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, members: p.members.map((m) => (m.userId === userId ? { ...m, role } : m)) }
          : p,
      ),
    }))
  }, [setIfAllowed])

  const removeProjectMember = useCallback((projectId: string, userId: string) => {
    setIfAllowed('manage_members', (prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, members: p.members.filter((m) => m.userId !== userId) } : p,
      ),
    }))
  }, [setIfAllowed])

  const addWorkspaceMember = useCallback((userId: string, role: Role) => {
    setIfAllowed('manage_workspace', (prev) => {
      if (prev.workspace.members.some((m) => m.userId === userId)) {
        return {
          ...prev,
          workspace: {
            ...prev.workspace,
            members: prev.workspace.members.map((m) => (m.userId === userId ? { ...m, role } : m)),
          },
        }
      }
      return {
        ...prev,
        workspace: { ...prev.workspace, members: [...prev.workspace.members, { userId, role }] },
      }
    })
  }, [setIfAllowed])

  const updateWorkspaceMember = useCallback((userId: string, role: Role) => {
    setIfAllowed('manage_workspace', (prev) => ({
      ...prev,
      workspace: {
        ...prev.workspace,
        members: prev.workspace.members.map((m) => (m.userId === userId ? { ...m, role } : m)),
      },
    }))
  }, [setIfAllowed])

  const updateWorkspace = useCallback((patch: Partial<Pick<WorkspaceName, 'name'>>) => {
    setIfAllowed('manage_workspace', (prev) => ({
      ...prev,
      workspace: { ...prev.workspace, ...patch },
    }))
  }, [setIfAllowed])

  const createIssue = useCallback((input: CreateIssueInput) => {
    let createdId: string | null = null
    setIfAllowed('create_issue', (prev) => {
      const project = prev.projects.find((p) => p.id === (input.projectId ?? prev.currentProjectId))
      if (!project || !prev.currentUserId) return prev
      const id = nextIssueId(prev.issues, project)
      createdId = id
      const assigneeId = input.assigneeId || prev.currentUserId
      const column = input.column || project.columns[0]?.id || 'todo'
      const issue: Issue = {
        id,
        projectId: project.id,
        title: input.title.trim(),
        description: input.description?.trim() ?? '',
        priority: input.priority ?? 'medium',
        type: input.type ?? 'task',
        column,
        tag: input.tag || project.labels[0] || 'General',
        assigneeId,
        dueDate: input.dueDate ?? null,
        sprintId: input.sprintId ?? null,
        blockedBy: [],
        subtasks: [],
        attachments: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      const actor = prev.users.find((u) => u.id === prev.currentUserId)
      let notifications = prev.notifications
      if (assigneeId !== prev.currentUserId) {
        notifications = pushNotification(prev, {
          userId: assigneeId,
          type: 'assigned',
          issueId: id,
          message: `${actor?.name ?? 'Someone'} assigned you ${id}`,
        })
      }
      return {
        ...prev,
        issues: [issue, ...prev.issues],
        activities: pushActivity(prev, id, 'created', 'created this issue'),
        notifications,
        composer: { open: false, columnId: null },
      }
    })
    return createdId
  }, [setIfAllowed])

  const updateIssue = useCallback((issueId: string, patch: IssuePatch) => {
    setIfAllowed('edit_issue', (prev) => {
      const issue = prev.issues.find((i) => i.id === issueId)
      if (!issue) return prev
      const next = { ...issue, ...patch, updatedAt: nowIso() }
      let activities = prev.activities
      let notifications = prev.notifications
      const actor = prev.users.find((u) => u.id === prev.currentUserId)
      const project = prev.projects.find((p) => p.id === issue.projectId)

      if (patch.column && patch.column !== issue.column) {
        const title = project?.columns.find((c) => c.id === patch.column)?.title ?? patch.column
        activities = pushActivity({ ...prev, activities }, issueId, 'status', `moved this to ${title}`)
        notifications = pushNotification(
          { ...prev, notifications },
          {
            userId: issue.assigneeId,
            type: 'status_change',
            issueId,
            message: `${issueId} was moved to ${title}`,
          },
        )
      }
      if (patch.assigneeId && patch.assigneeId !== issue.assigneeId) {
        const name = prev.users.find((u) => u.id === patch.assigneeId)?.name ?? 'someone'
        activities = pushActivity({ ...prev, activities }, issueId, 'assignee', `assigned ${name}`)
        notifications = pushNotification(
          { ...prev, notifications },
          {
            userId: patch.assigneeId,
            type: 'assigned',
            issueId,
            message: `${actor?.name ?? 'Someone'} assigned you ${issueId}`,
          },
        )
      }
      if (patch.title || patch.description || patch.priority || patch.type || patch.tag || patch.dueDate !== undefined || patch.sprintId !== undefined) {
        if (!patch.column && !patch.assigneeId) {
          activities = pushActivity({ ...prev, activities }, issueId, 'updated', 'updated this issue')
        }
      }

      return {
        ...prev,
        issues: prev.issues.map((i) => (i.id === issueId ? next : i)),
        activities,
        notifications,
      }
    })
  }, [setIfAllowed])

  const moveIssue = useCallback((issueId: string, column: string) => {
    setState((prev) => {
      if (!canRole(resolveRole(prev), 'edit_issue')) return prev
      const issue = prev.issues.find((i) => i.id === issueId)
      if (!issue || issue.column === column) return prev
      const project = prev.projects.find((p) => p.id === issue.projectId)
      const title = project?.columns.find((c) => c.id === column)?.title ?? column
      const notifications = pushNotification(prev, {
        userId: issue.assigneeId,
        type: 'status_change',
        issueId,
        message: `${issueId} was moved to ${title}`,
      })
      return {
        ...prev,
        issues: prev.issues.map((i) => (i.id === issueId ? { ...i, column, updatedAt: nowIso() } : i)),
        activities: pushActivity(prev, issueId, 'status', `moved this to ${title}`),
        notifications,
      }
    })
  }, [])

  const deleteIssue = useCallback((issueId: string) => {
    setIfAllowed('delete_issue', (prev) => ({
      ...prev,
      issues: prev.issues.filter((i) => i.id !== issueId),
      comments: prev.comments.filter((c) => c.issueId !== issueId),
    }))
  }, [setIfAllowed])

  const addComment = useCallback((issueId: string, body: string) => {
    setIfAllowed('comment', (prev) => {
      if (!prev.currentUserId || !body.trim()) return prev
      const issue = prev.issues.find((i) => i.id === issueId)
      const actor = prev.users.find((u) => u.id === prev.currentUserId)
      let notifications = prev.notifications
      if (issue && issue.assigneeId !== prev.currentUserId) {
        notifications = pushNotification(prev, {
          userId: issue.assigneeId,
          type: 'comment',
          issueId,
          message: `${actor?.name ?? 'Someone'} commented on ${issueId}`,
        })
      }
      return {
        ...prev,
        comments: [
          {
            id: nid('c'),
            issueId,
            authorId: prev.currentUserId,
            body: body.trim(),
            createdAt: nowIso(),
          },
          ...prev.comments,
        ],
        activities: pushActivity(prev, issueId, 'comment', 'commented'),
        notifications,
      }
    })
  }, [setIfAllowed])

  const toggleSubtask = useCallback((issueId: string, subtaskId: string) => {
    setIfAllowed('edit_issue', (prev) => ({
      ...prev,
      issues: prev.issues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              subtasks: i.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)),
              updatedAt: nowIso(),
            }
          : i,
      ),
    }))
  }, [setIfAllowed])

  const addSubtask = useCallback((issueId: string, title: string) => {
    setIfAllowed('edit_issue', (prev) => {
      if (!title.trim()) return prev
      return {
        ...prev,
        issues: prev.issues.map((i) =>
          i.id === issueId
            ? {
                ...i,
                subtasks: [...i.subtasks, { id: nid('st'), title: title.trim(), done: false }],
                updatedAt: nowIso(),
              }
            : i,
        ),
      }
    })
  }, [setIfAllowed])

  const addAttachment = useCallback((issueId: string, name: string) => {
    setIfAllowed('edit_issue', (prev) => {
      if (!name.trim()) return prev
      return {
        ...prev,
        issues: prev.issues.map((i) =>
          i.id === issueId
            ? {
                ...i,
                attachments: [...i.attachments, { id: nid('att'), name: name.trim(), size: '12 KB' }],
                updatedAt: nowIso(),
              }
            : i,
        ),
      }
    })
  }, [setIfAllowed])

  const createSprint = useCallback((input: { name: string; startDate: string; endDate: string; status?: SprintStatus }) => {
    setIfAllowed('manage_sprints', (prev) => ({
      ...prev,
      sprints: [
        ...prev.sprints,
        {
          id: nid('sp'),
          projectId: prev.currentProjectId,
          name: input.name.trim() || 'Sprint',
          status: input.status ?? 'planned',
          startDate: input.startDate,
          endDate: input.endDate,
        },
      ],
    }))
  }, [setIfAllowed])

  const updateSprint = useCallback(
    (sprintId: string, patch: Partial<Pick<Sprint, 'name' | 'status' | 'startDate' | 'endDate'>>) => {
      setIfAllowed('manage_sprints', (prev) => ({
        ...prev,
        sprints: prev.sprints.map((s) => (s.id === sprintId ? { ...s, ...patch } : s)),
      }))
    },
    [setIfAllowed],
  )

  const closeSprint = useCallback((sprintId: string) => {
    setIfAllowed('manage_sprints', (prev) => ({
      ...prev,
      sprints: prev.sprints.map((s) => (s.id === sprintId ? { ...s, status: 'closed' as const } : s)),
    }))
  }, [setIfAllowed])

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.userId === prev.currentUserId ? { ...n, read: true } : n,
      ),
    }))
  }, [])

  const updateAccountPrefs = useCallback((patch: Partial<AccountPrefs>) => {
    setState((prev) => {
      if (!prev.currentUserId) return prev
      return {
        ...prev,
        accountPrefs: {
          ...prev.accountPrefs,
          [prev.currentUserId]: { ...(prev.accountPrefs[prev.currentUserId] ?? defaultPrefs), ...patch },
        },
      }
    })
  }, [])

  const updateUserProfile = useCallback((patch: Partial<Pick<User, 'name'>>) => {
    setState((prev) => {
      if (!prev.currentUserId || !patch.name?.trim()) return prev
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === prev.currentUserId ? { ...u, name: patch.name!.trim() } : u)),
      }
    })
  }, [])

  const addLabel = useCallback((projectId: string, label: string) => {
    setIfAllowed('edit_project', (prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId && label.trim() && !p.labels.includes(label.trim())
          ? { ...p, labels: [...p.labels, label.trim()] }
          : p,
      ),
    }))
  }, [setIfAllowed])

  const removeLabel = useCallback((projectId: string, label: string) => {
    setIfAllowed('edit_project', (prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, labels: p.labels.filter((l) => l !== label) } : p,
      ),
    }))
  }, [setIfAllowed])

  const addColumn = useCallback((projectId: string, title: string) => {
    setIfAllowed('edit_project', (prev) => {
      if (!title.trim()) return prev
      const column: Column = {
        id: nid('col'),
        title: title.trim(),
      }
      return {
        ...prev,
        projects: prev.projects.map((p) => (p.id === projectId ? { ...p, columns: [...p.columns, column] } : p)),
      }
    })
  }, [setIfAllowed])

  const updateColumn = useCallback((projectId: string, columnId: string, title: string) => {
    setIfAllowed('edit_project', (prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, columns: p.columns.map((c) => (c.id === columnId ? { ...c, title } : c)) }
          : p,
      ),
    }))
  }, [setIfAllowed])

  const removeColumn = useCallback((projectId: string, columnId: string) => {
    setIfAllowed('edit_project', (prev) => {
      const project = prev.projects.find((p) => p.id === projectId)
      if (!project || project.columns.length <= 1) return prev
      const fallback = project.columns.find((c) => c.id !== columnId)?.id
      if (!fallback) return prev
      return {
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, columns: p.columns.filter((c) => c.id !== columnId) } : p,
        ),
        issues: prev.issues.map((i) =>
          i.projectId === projectId && i.column === columnId ? { ...i, column: fallback } : i,
        ),
      }
    })
  }, [setIfAllowed])

  const value = useMemo<StoreValue>(() => {
    const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null
    const currentProject = state.projects.find((p) => p.id === state.currentProjectId)
    const role = resolveRole(state)
    const usersById = Object.fromEntries(state.users.map((u) => [u.id, u]))
    const wsRole = state.workspace.members.find((m) => m.userId === state.currentUserId)?.role
    const visibleProjects =
      wsRole === 'owner' || wsRole === 'admin'
        ? state.projects
        : state.projects.filter((p) => p.members.some((m) => m.userId === state.currentUserId))

    return {
      ...state,
      hydrated,
      currentUser,
      currentProject,
      role,
      usersById,
      visibleProjects,
      can: (action) => canRole(role, action),
      login,
      logout,
      selectProject,
      resetDemo,
      openComposer,
      closeComposer,
      createProject,
      updateProject,
      deleteProject,
      addProjectMember,
      updateProjectMember,
      removeProjectMember,
      addWorkspaceMember,
      updateWorkspaceMember,
      updateWorkspace,
      createIssue,
      updateIssue,
      moveIssue,
      deleteIssue,
      addComment,
      toggleSubtask,
      addSubtask,
      addAttachment,
      createSprint,
      updateSprint,
      closeSprint,
      markNotificationRead,
      markAllNotificationsRead,
      updateAccountPrefs,
      updateUserProfile,
      addLabel,
      removeLabel,
      addColumn,
      updateColumn,
      removeColumn,
    }
  }, [
    state,
    hydrated,
    login,
    logout,
    selectProject,
    resetDemo,
    openComposer,
    closeComposer,
    createProject,
    updateProject,
    deleteProject,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    addWorkspaceMember,
    updateWorkspaceMember,
    updateWorkspace,
    createIssue,
    updateIssue,
    moveIssue,
    deleteIssue,
    addComment,
    toggleSubtask,
    addSubtask,
    addAttachment,
    createSprint,
    updateSprint,
    closeSprint,
    markNotificationRead,
    markAllNotificationsRead,
    updateAccountPrefs,
    updateUserProfile,
    addLabel,
    removeLabel,
    addColumn,
    updateColumn,
    removeColumn,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within MockStoreProvider')
  return ctx
}
