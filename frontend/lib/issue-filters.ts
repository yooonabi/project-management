import { isOverdue, startOfWeek } from '@/lib/format'
import type { Issue, Priority, TaskType } from '@/lib/types'

export type IssueQuery = {
  q?: string
  assignee?: string
  type?: TaskType | ''
  priority?: Priority | ''
  sprint?: string
  column?: string
  mine?: boolean
  overdue?: boolean
  openBugs?: boolean
  doneWeek?: boolean
}

export function applyIssueQuery(
  issues: Issue[],
  query: IssueQuery,
  opts: { currentUserId: string | null; doneColumnId?: string },
): Issue[] {
  const doneId = opts.doneColumnId ?? 'done'
  const weekStart = startOfWeek().getTime()

  return issues.filter((issue) => {
    if (query.q) {
      const q = query.q.toLowerCase()
      const hay = `${issue.id} ${issue.title} ${issue.tag}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (query.assignee === 'me' || query.mine) {
      if (issue.assigneeId !== opts.currentUserId) return false
    } else if (query.assignee && issue.assigneeId !== query.assignee) {
      return false
    }
    if (query.type && issue.type !== query.type) return false
    if (query.priority && issue.priority !== query.priority) return false
    if (query.column && issue.column !== query.column) return false
    if (query.sprint === 'backlog') {
      if (issue.sprintId) return false
    } else if (query.sprint === 'active') {
      /* handled by caller with active sprint id */
    } else if (query.sprint && issue.sprintId !== query.sprint) {
      return false
    }
    if (query.overdue && !isOverdue(issue.dueDate, issue.column, doneId)) return false
    if (query.openBugs && (issue.type !== 'bug' || issue.column === doneId)) return false
    if (query.doneWeek) {
      if (issue.column !== doneId) return false
      if (new Date(issue.updatedAt).getTime() < weekStart) return false
    }
    return true
  })
}
