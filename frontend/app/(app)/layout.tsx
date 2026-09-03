'use client'

import { DashboardShell } from '@/components/dashboard-shell'
import { AuthGate } from '@/components/auth-gate'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  )
}
