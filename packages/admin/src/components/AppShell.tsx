'use client'

import { useState, type ReactNode } from 'react'
import { usePathname, redirect } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { PublicLayout } from './PublicLayout'

const PUBLIC_PATHS = ['/', '/about', '/onboarding', '/login', '/super-admin', '/api-docs', '/support', '/download', '/marketplace', '/plants', '/diseases']

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated, loading, user } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isPublic = PUBLIC_PATHS.some(p => pathname === p || (p !== '/' && pathname.startsWith(p)))
  const isRoot = pathname === '/'
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin h-8 w-8 border-2 border-admin-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isRoot && isAuthenticated) {
    redirect('/dashboard')
  }

  if (!isPublic && !isAuthenticated) {
    redirect('/login')
  }

  if (!isPublic && isAuthenticated && !isAdmin) {
    redirect('/download')
  }

  if (isPublic) {
    return <PublicLayout>{children}</PublicLayout>
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 64 : 260 }}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
