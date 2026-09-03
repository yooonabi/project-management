'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  CircleDot,
  Settings,
  Kanban,
  LogOut,
  Columns3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { UserAvatar } from '@/components/user-avatar'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Board', href: '/board', icon: Columns3 },
  { label: 'Issues', href: '/issues', icon: CircleDot },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const store = useStore()

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Kanban className="size-5" />
        </span>
        <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
          {store.workspace.name}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pt-4" aria-label="Primary">
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {nav.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/projects' && pathname.startsWith(`${href}/`))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onNavigate?.()}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
              )}
            >
              <Icon className="size-[1.15rem]" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {store.currentUser ? (
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <UserAvatar member={store.currentUser} size="md" className="ring-sidebar" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{store.currentUser.name}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">{store.role}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                store.logout()
                onNavigate?.()
              }}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
