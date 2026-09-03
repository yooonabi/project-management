export function formatRelative(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return 'just now'
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatDate(iso: string | null): string {
  if (!iso) return 'None'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isOverdue(dueDate: string | null, columnId: string, doneColumnId = 'done'): boolean {
  if (!dueDate || columnId === doneColumnId) return false
  const due = new Date(dueDate)
  due.setHours(23, 59, 59, 999)
  return due.getTime() < Date.now()
}

export function startOfWeek(now = new Date()): Date {
  const d = new Date(now)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function nid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}
