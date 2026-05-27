'use client'

import { useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (pathname === '/login') {
    return <>{children}</>
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
