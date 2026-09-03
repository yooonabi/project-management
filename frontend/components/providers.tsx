'use client'

import type { ReactNode } from 'react'
import { MockStoreProvider } from '@/lib/store'

export function Providers({ children }: { children: ReactNode }) {
  return <MockStoreProvider>{children}</MockStoreProvider>
}
