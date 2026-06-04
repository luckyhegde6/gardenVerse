'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Search,
  LogOut,
  Settings,
  User,
  ChevronDown,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'User Management',
  '/support': 'Support Tickets',
  '/moderation': 'Moderation Queue',
  '/marketplace': 'Marketplace',
  '/analytics': 'Analytics',
  '/features': 'Feature Flags',
  '/invites': 'Invite Management',
  '/campaigns': 'Campaigns',
  '/onboarding': 'Getting Started',
  '/monitoring': 'System Monitoring',
}

export function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [showSearch, setShowSearch] = useState(false)
  const [openTickets, setOpenTickets] = useState(0)

  useEffect(() => {
    const fetchOpenCount = async () => {
      try {
        const res = await api.get('/support/tickets', { params: { status: 'OPEN', limit: 1 } })
        setOpenTickets((res.data as Record<string, unknown>)?.total as number || 0)
      } catch {}
    }
    fetchOpenCount()
    const interval = setInterval(fetchOpenCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const title = Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] || 'Admin'

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className={cn(
          'relative transition-all duration-200',
          showSearch ? 'w-64' : 'w-9'
        )}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            onFocus={() => setShowSearch(true)}
            onBlur={e => !e.target.value && setShowSearch(false)}
            className={cn(
              'rounded-lg border border-slate-700 bg-slate-800/50 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500 transition-all',
              showSearch ? 'w-full' : 'w-9 cursor-pointer opacity-60 hover:opacity-100'
            )}
          />
        </div>

        <Link
          href="/support"
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {openTickets > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-950 px-1">
              {openTickets > 99 ? '99+' : openTickets}
            </span>
          )}
        </Link>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-admin-500/20 flex items-center justify-center">
              <span className="text-sm font-medium text-admin-400">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-200 leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'admin'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] rounded-xl border border-slate-700/60 bg-slate-900 p-1.5 shadow-2xl z-50"
              align="end"
              sideOffset={8}
            >
              <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer outline-none">
                <User className="w-4 h-4" />
                Profile
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer outline-none">
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-slate-800 my-1" />
              <DropdownMenu.Item
                onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 cursor-pointer outline-none"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
