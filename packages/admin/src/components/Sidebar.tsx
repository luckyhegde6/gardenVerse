'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Shield,
  Store,
  BarChart3,
  Flag,
  Mail,
  Megaphone,
  Sprout,
  ChevronLeft,
  ChevronRight,
  Activity,
  Trees,
  CloudSun,
  MessageCircle,
  Scan,
  Settings,
  GraduationCap,
  TicketCheck,
  Gamepad2,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/onboarding', label: 'Onboarding', icon: GraduationCap },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/monitoring', label: 'Monitoring', icon: Activity },
  { href: '/garden', label: 'Gardens', icon: Trees },
  { href: '/gamification', label: 'Gamification', icon: Gamepad2 },
  { href: '/weather', label: 'Weather', icon: CloudSun },
  { href: '/community', label: 'Community', icon: MessageCircle },
  { href: '/ai-scanner', label: 'AI Scanner', icon: Scan },
  { href: '/moderation', label: 'Moderation', icon: Shield },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/features', label: 'Feature Flags', icon: Flag },
  { href: '/support', label: 'Support', icon: TicketCheck },
  { href: '/invites', label: 'Invites', icon: Mail },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/super-admin/dashboard', label: 'Super Admin', icon: Activity },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-30 flex flex-col bg-sidebar border-r border-slate-800/60 transition-all duration-300',
        collapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-slate-800/60',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-admin-500/20">
              <Sprout className="w-5 h-5 text-admin-400" />
            </div>
            <span className="font-semibold text-slate-100 text-lg tracking-tight">GardenVerse</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-admin-500/20">
              <Sprout className="w-5 h-5 text-admin-400" />
            </div>
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2 space-y-1">
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-admin-500/10 text-admin-400 shadow-[inset_2px_0_0_0] shadow-admin-500'
                  : 'text-sidebar-foreground hover:text-sidebar-foreground-active hover:bg-sidebar-hover'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-800/60">
        <div className="px-2 pt-3 pb-1">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              collapsed ? 'justify-center' : '',
              'text-sidebar-foreground hover:text-sidebar-foreground-active hover:bg-sidebar-hover'
            )}
            title={collapsed ? 'API Docs' : undefined}
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            {!collapsed && <span>API Docs</span>}
          </a>
        </div>
        <div className="p-3 pt-1">
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-full p-2 rounded-lg text-sidebar-foreground hover:text-sidebar-foreground-active hover:bg-sidebar-hover transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  )
}
