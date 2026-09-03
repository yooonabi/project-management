'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, Bell, Plus, FolderKanban, CircleDot, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectSwitcher } from '@/components/project-switcher'
import { UserAvatar } from '@/components/user-avatar'
import { useStore } from '@/lib/store'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const store = useStore()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const notifications = store.notifications.filter((n) => n.userId === store.currentUserId)
  const unread = notifications.some((n) => !n.read)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { issues: [], projects: [], people: [] }
    const visibleIds = new Set(store.visibleProjects.map((p) => p.id))
    return {
      issues: store.issues
        .filter((i) => visibleIds.has(i.projectId) && `${i.id} ${i.title} ${i.tag}`.toLowerCase().includes(q))
        .slice(0, 6),
      projects: store.visibleProjects.filter((p) => `${p.key} ${p.name}`.toLowerCase().includes(q)).slice(0, 4),
      people: store.users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q)).slice(0, 4),
    }
  }, [query, store.issues, store.users, store.visibleProjects])

  const hasResults = results.issues.length + results.projects.length + results.people.length > 0

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false)
        setMobileSearch(false)
      }
      if (!notifRef.current?.contains(event.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMobileSearch(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function goIssue(id: string) {
    setSearchOpen(false)
    setMobileSearch(false)
    setQuery('')
    router.push(`/issues/${id}`)
  }

  const searchPanel =
    searchOpen && query.trim() ? (
      <div className="absolute top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-xl border border-border bg-card py-2 shadow-lg">
        {!hasResults ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">No matches for “{query}”</p>
        ) : (
          <>
            {results.issues.length > 0 ? (
              <SearchGroup label="Issues">
                {results.issues.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => goIssue(issue.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <CircleDot className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">{issue.id}</span>
                  </button>
                ))}
              </SearchGroup>
            ) : null}
            {results.projects.length > 0 ? (
              <SearchGroup label="Projects">
                {results.projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      store.selectProject(project.id)
                      setSearchOpen(false)
                      setMobileSearch(false)
                      setQuery('')
                      router.push('/board')
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <FolderKanban className="size-4 text-muted-foreground" />
                    {project.name}
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{project.key}</span>
                  </button>
                ))}
              </SearchGroup>
            ) : null}
            {results.people.length > 0 ? (
              <SearchGroup label="People">
                {results.people.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false)
                      setMobileSearch(false)
                      setQuery('')
                      router.push(`/issues?assignee=${user.id}`)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Users className="size-4 text-muted-foreground" />
                    {user.name}
                    <span className="ml-auto text-xs text-muted-foreground">{user.email}</span>
                  </button>
                ))}
              </SearchGroup>
            ) : null}
          </>
        )}
      </div>
    ) : null

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </button>

      <div
        className={cn(
          'relative',
          mobileSearch ? 'block flex-1' : 'hidden max-w-md flex-1 sm:block',
        )}
        ref={searchRef}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          autoFocus={mobileSearch}
          onChange={(e) => {
            setQuery(e.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search tasks, projects, people..."
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        {searchPanel}
      </div>

      <div className={cn('ml-auto flex items-center gap-2', mobileSearch && 'hidden sm:flex')}>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
          aria-label="Search"
          onClick={() => {
            setMobileSearch(true)
            setSearchOpen(true)
          }}
        >
          <Search className="size-5" />
        </button>

        <ProjectSwitcher />

        <Button
          size="lg"
          className="gap-1.5"
          disabled={!store.can('create_issue')}
          title={!store.can('create_issue') ? 'Guests have view-only access' : undefined}
          onClick={() => store.openComposer()}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add New Task</span>
          <span className="sm:hidden">Add</span>
        </Button>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="size-5" />
            {unread ? <span className="absolute right-2 top-2 size-2 rounded-full bg-chart-4 ring-2 ring-background" /> : null}
          </button>
          {notifOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-sm font-semibold">Notifications</p>
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => store.markAllNotificationsRead()}
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">You are all caught up.</p>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        store.markNotificationRead(item.id)
                        setNotifOpen(false)
                        router.push(`/issues/${item.issueId}`)
                      }}
                      className={cn(
                        'flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-muted',
                        !item.read && 'bg-accent/60',
                      )}
                    >
                      <span className="text-sm text-foreground">{item.message}</span>
                      <span className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        {store.currentUser ? (
          <Link
            href="/settings"
            className="inline-flex"
            aria-label={store.currentUser.name}
            title={store.currentUser.name}
          >
            <UserAvatar member={store.currentUser} size="md" />
          </Link>
        ) : null}
      </div>
    </header>
  )
}

function SearchGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}
