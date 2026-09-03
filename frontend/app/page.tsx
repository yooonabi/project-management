'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function HomePage() {
  const { hydrated, currentUser } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    router.replace(currentUser ? '/board' : '/login')
  }, [hydrated, currentUser, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading Flowboard…
    </div>
  )
}
