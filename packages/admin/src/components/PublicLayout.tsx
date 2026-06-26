'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sprout, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/Button'

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/onboarding', label: 'Getting Started' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/plants', label: 'Plants' },
  { href: '/diseases', label: 'Diseases' },
  { href: '/about', label: 'About' },
  { href: '/support', label: 'Support' },
  { href: '/download', label: 'Download App' },
]

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20">
                <Sprout className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-semibold text-slate-100 text-lg tracking-tight">GardenVerse</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {publicLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="primary" size="sm">Dashboard</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm">Admin Login</Button>
                </Link>
              )}
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-800/60 bg-slate-950">
            <div className="px-4 py-3 space-y-1">
              {publicLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-800/60">
                {isAuthenticated ? (
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    <Button variant="primary" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="primary" className="w-full">Admin Login</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-slate-800/60 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sprout className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-slate-100">GardenVerse</span>
              </div>
              <p className="text-sm text-slate-500">
                A hybrid agriculture simulation ecosystem — virtual gardening, AI-powered assistance, and community-driven farming.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Platform</h4>
              <div className="space-y-2">
                <Link href="/onboarding" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Getting Started</Link>
                <Link href="/about" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">About</Link>
                <Link href="/support" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Support</Link>
                <Link href="/marketplace" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Marketplace</Link>
                <Link href="/download" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Download App</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Admin</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Admin Login</Link>
                {isAuthenticated && (
                  <Link href="/dashboard" className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Dashboard</Link>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
            <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} GardenVerse. Grow Together, Sustainably.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
