'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Kanban } from 'lucide-react'
import { useStore } from '@/lib/store'
import { UserAvatar } from '@/components/user-avatar'

const roleLabel: Record<string, string> = {
  owner: 'Owner — full access',
  admin: 'Admin — manage projects and members',
  member: 'Member — create and update issues',
  guest: 'Guest — view only',
}

export default function LoginPage() {
  const store = useStore()
  const router = useRouter()

  useEffect(() => {
    if (store.hydrated && store.currentUser) router.replace('/board')
  }, [store.hydrated, store.currentUser, router])

  if (!store.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading Flowboard…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Kanban className="size-6" />
        </span>
        <div>
          <p className="text-lg font-semibold tracking-tight">Flowboard</p>
          <p className="text-sm text-muted-foreground">Pick a mock account to continue</p>
        </div>
      </div>

      <div className="grid w-full max-w-lg gap-2">
        {store.users.map((user) => {
          const role = store.workspace.members.find((m) => m.userId === user.id)?.role ?? 'member'
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                store.login(user.id)
                router.push('/board')
              }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <UserAvatar member={user} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{user.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium capitalize text-secondary-foreground">
                {role}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        {Object.values(roleLabel).join(' · ')} Session is stored in this browser only.
      </p>
    </div>
  )
}
