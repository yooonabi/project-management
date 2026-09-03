import type { Role } from '@/lib/types'

export type Action =
  | 'create_issue'
  | 'edit_issue'
  | 'delete_issue'
  | 'comment'
  | 'create_project'
  | 'edit_project'
  | 'delete_project'
  | 'manage_members'
  | 'manage_workspace'
  | 'manage_sprints'

const allowed: Record<Action, Role[]> = {
  create_issue: ['owner', 'admin', 'member'],
  edit_issue: ['owner', 'admin', 'member'],
  delete_issue: ['owner', 'admin'],
  comment: ['owner', 'admin', 'member'],
  create_project: ['owner', 'admin'],
  edit_project: ['owner', 'admin'],
  manage_members: ['owner', 'admin'],
  manage_workspace: ['owner', 'admin'],
  manage_sprints: ['owner', 'admin'],
  delete_project: ['owner'],
}

export function can(role: Role | null | undefined, action: Action): boolean {
  if (!role) return false
  return allowed[action].includes(role)
}

export function permissionHint(role: Role | null | undefined, action: Action): string | undefined {
  if (can(role, action)) return undefined
  if (role === 'guest') return 'Guests have view-only access'
  return "You don't have permission for this action"
}
