'use client'

import { useState } from 'react'
import { Send, CheckCircle, AlertCircle, TicketCheck, Mail, MessageSquare, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { cn } from '@/lib/utils'

const PRIORITIES = [
  { value: 'LOW', label: 'Low — General question', color: 'text-sky-400' },
  { value: 'MEDIUM', label: 'Medium — Issue affecting me', color: 'text-amber-400' },
  { value: 'HIGH', label: 'High — Urgent / blocking', color: 'text-red-400' },
]

const CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'Account Issue',
  'Payment / Billing',
  'Garden / Gameplay',
  'Marketplace',
  'Community',
  'Other',
]

export default function PublicSupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/v1/support/tickets/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          email: email.trim(),
          category,
          priority,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ticket')
      }

      setTicketId(data.id)
      setSuccess(true)
      setSubject('')
      setMessage('')
      setEmail('')
      setCategory('')
      setPriority('MEDIUM')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Ticket Submitted!</h2>
            <p className="text-slate-400">
              Your support request has been received. Our team will review it and respond via email.
            </p>
          </div>
          {ticketId && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Ticket Reference</p>
              <p className="text-sm font-mono text-emerald-400">#{ticketId.slice(0, 8).toUpperCase()}</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Mail className="w-4 h-4" />
            <span>Confirmation sent to {email || 'your email'}</span>
          </div>
          <Button variant="secondary" onClick={() => { setSuccess(false); setTicketId(null) }}>
            Submit Another Ticket
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <TicketCheck className="w-7 h-7 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">Contact Support</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Having trouble? Found a bug? Send us a message and we&apos;ll get back to you as soon as possible.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="support-email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="support-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={254}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">We&apos;ll respond to this address</p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="support-category" className="block text-sm font-medium text-slate-300 mb-1.5">
              Category
            </label>
            <select
              id="support-category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors appearance-none"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    priority === p.value
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600/50'
                  )}
                >
                  <AlertTriangle className={cn('w-3.5 h-3.5', p.color)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="support-subject" className="block text-sm font-medium text-slate-300 mb-1.5">
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              id="support-subject"
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
            />
            <p className="mt-1 text-xs text-slate-500">{subject.length}/200 characters</p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="support-message" className="block text-sm font-medium text-slate-300 mb-1.5">
              Message <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <textarea
                id="support-message"
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue in detail. Include steps to reproduce if it's a bug."
                rows={5}
                maxLength={5000}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors resize-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{message.length}/5000 characters</p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={submitting}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </form>
      </div>

      {/* Info footer */}
      <div className="mt-6 text-center text-xs text-slate-500">
        <p>Typical response time: 24–48 hours • For urgent issues, mark as High priority</p>
      </div>
    </div>
  )
}
