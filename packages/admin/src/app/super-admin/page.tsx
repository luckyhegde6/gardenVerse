'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Key, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Badge } from '@/components/Badge'

export default function SuperAdminPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ email: '', password: '', username: '', registrationCode: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = mode === 'login' ? '/admin/login' : '/admin/register'
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, username: form.username, registrationCode: form.registrationCode }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Request failed')
      }

      router.push('/super-admin/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-admin-500/10 ring-1 ring-admin-500/20">
            <Shield className="w-8 h-8 text-admin-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">GardenVerse</h1>
          <p className="text-sm text-slate-400">Super Admin Portal</p>
        </div>

        <div className="flex rounded-lg border border-slate-800 overflow-hidden">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === 'login' ? 'bg-admin-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <LogIn className="w-4 h-4" /> Login
          </button>
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === 'register' ? 'bg-admin-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <UserPlus className="w-4 h-4" /> Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="superadmin@gardenverse.io"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder={mode === 'register' ? 'Min 12 chars, mix of letters, numbers, symbols' : 'Enter your password'}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            minLength={mode === 'register' ? 12 : 1}
            required
          />
          {mode === 'register' && (
            <>
              <Input
                label="Username"
                placeholder="super_admin"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
              <Input
                label="Registration Code"
                type="password"
                placeholder="Enter super admin registration code"
                value={form.registrationCode}
                onChange={e => setForm({ ...form, registrationCode: e.target.value })}
                required
              />
            </>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : mode === 'login' ? 'Login to Admin Portal' : 'Register Super Admin'}
          </Button>
        </form>

        <p className="text-xs text-center text-slate-600">
          All admin actions are audited and logged. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  )
}
