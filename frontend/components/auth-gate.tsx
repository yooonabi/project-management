'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { hydrated, currentUser } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    if (!currentUser) router.replace('/login')
  }, [hydrated, currentUser, router])

  if (!hydrated || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading Flowboard…
      </div>
    )
  }

  return <>{children}</>
}
