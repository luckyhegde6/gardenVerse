'use client'

import { useState, type FormEvent } from 'react'
import { Sprout } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'

export default function LoginPage() {
  const { login, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin h-8 w-8 border-2 border-admin-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-admin-500/20 mb-4">
            <Sprout className="w-7 h-7 text-admin-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Login</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to manage GardenVerse</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@gardenverse.vercel.app"
            required
          />

          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" loading={submitting} className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          GardenVerse Admin Panel v1.0
        </p>
      </div>
    </div>
  )
}
