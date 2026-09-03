export type Role = 'owner' | 'admin' | 'member' | 'guest'
export type Priority = 'high' | 'medium' | 'low'
export type TaskType = 'feature' | 'bug' | 'task' | 'improvement'
export type SprintStatus = 'planned' | 'active' | 'closed'
export type NotificationType = 'assigned' | 'comment' | 'status_change'
export type ActivityType = 'created' | 'status' | 'assignee' | 'comment' | 'updated'

export interface User {
  id: string
  name: string
  email: string
  initials: string
  color: string
}

export interface Membership {
  userId: string
  role: Role
}

export interface Workspace {
  id: string
  name: string
  members: Membership[]
}

export interface Column {
  id: string
  title: string
}

export interface Project {
  id: string
  key: string
  name: string
  description: string
  members: Membership[]
  labels: string[]
  columns: Column[]
}

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Attachment {
  id: string
  name: string
  size: string
}

export interface Issue {
  id: string
  projectId: string
  title: string
  description: string
  priority: Priority
  type: TaskType
  column: string
  tag: string
  assigneeId: string
  dueDate: string | null
  sprintId: string | null
  blockedBy: string[]
  subtasks: Subtask[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  issueId: string
  authorId: string
  body: string
  createdAt: string
}

export interface Activity {
  id: string
  issueId: string
  actorId: string
  type: ActivityType
  message: string
  createdAt: string
}

export interface Sprint {
  id: string
  projectId: string
  name: string
  status: SprintStatus
  startDate: string
  endDate: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  issueId: string
  message: string
  read: boolean
  createdAt: string
}

export interface AccountPrefs {
  notifyAssigned: boolean
  notifyComments: boolean
  notifyStatus: boolean
}

export interface ComposerState {
  open: boolean
  columnId: string | null
}

export interface AppState {
  version: number
  workspace: Workspace
  users: User[]
  projects: Project[]
  issues: Issue[]
  comments: Comment[]
  activities: Activity[]
  sprints: Sprint[]
  notifications: Notification[]
  currentUserId: string | null
  currentProjectId: string
  accountPrefs: Record<string, AccountPrefs>
  composer: ComposerState
}

/** @deprecated Use Issue. Kept so older card props stay easy to map. */
export type Task = Issue
export type Member = User
export type ColumnId = string
