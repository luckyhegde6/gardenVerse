'use client'

import { useState } from 'react'
import { Mail, Shield, Calendar, Hash, ArrowLeft, CheckCircle, Copy, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Toggle } from '@/components/Toggle'

const inviteTypes = [
  { value: 'referral', label: 'Referral' },
  { value: 'event', label: 'Event' },
  { value: 'promo', label: 'Promotional' },
]

const expiryOptions = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'custom', label: 'Custom Date' },
]

export default function CreateInvitePage() {
  const [inviteType, setInviteType] = useState('referral')
  const [maxUses, setMaxUses] = useState('100')
  const [expiryPreset, setExpiryPreset] = useState('30d')
  const [customExpiryDate, setCustomExpiryDate] = useState('')
  const [description, setDescription] = useState('')
  const [requireEmailVerification, setRequireEmailVerification] = useState(true)
  const [generated, setGenerated] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const generateCode = () => {
    const prefix = inviteType === 'referral' ? 'REF' : inviteType === 'event' ? 'EVT' : 'PRO'
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    const code = `${prefix}-${randomPart}`
    setGeneratedCode(code)
    setGenerated(true)
    setTimeout(() => setGenerated(false), 4000)
  }

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard?.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isFormValid = inviteType && maxUses && description && (expiryPreset !== 'custom' || customExpiryDate)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/invites"
            className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-2 rounded-lg bg-admin-500/10">
            <Mail className="w-5 h-5 text-admin-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Create Invite</h1>
            <p className="text-sm text-slate-500">Generate new invite codes for users</p>
          </div>
        </div>
        {generated && (
          <Badge variant="success" dot>Invite Generated</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Form Fields */}
        <div className="xl:col-span-2 space-y-6">
          {/* Invite Configuration */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Invite Configuration</h3>
                <p className="text-xs text-slate-600 mt-0.5">Configure the settings for your invite code</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Invite Type"
                  id="invite-type"
                  value={inviteType}
                  onChange={e => setInviteType(e.target.value)}
                  options={inviteTypes}
                />
                <Input
                  label="Max Uses"
                  id="max-uses"
                  type="number"
                  min={1}
                  max={9999}
                  value={maxUses}
                  onChange={e => setMaxUses(e.target.value)}
                  placeholder="100"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select
                    label="Expiry"
                    id="expiry-preset"
                    value={expiryPreset}
                    onChange={e => setExpiryPreset(e.target.value)}
                    options={expiryOptions}
                  />
                  {expiryPreset === 'custom' && (
                    <Input
                      label="Custom Expiry Date"
                      id="custom-expiry"
                      type="date"
                      value={customExpiryDate}
                      onChange={e => setCustomExpiryDate(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the purpose of this invite code — who it's for, what it grants, and any special conditions..."
                    rows={4}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sky-400/10 mt-0.5">
                    <Shield className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Require Email Verification</p>
                    <p className="text-xs text-slate-500">
                      Users must verify their email before redeeming this invite
                    </p>
                  </div>
                </div>
                <Toggle
                  pressed={requireEmailVerification}
                  onPressedChange={setRequireEmailVerification}
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Advanced Settings</h3>
                <p className="text-xs text-slate-600 mt-0.5">Additional invite configuration options</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Reward Tier"
                id="reward-tier"
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'premium', label: 'Premium' },
                  { value: 'beta', label: 'Beta' },
                ]}
                defaultValue="standard"
              />
              <Input
                label="Max Redemptions Per User"
                id="max-per-user"
                type="number"
                min={1}
                defaultValue="1"
                placeholder="1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <Select
                label="Granted Role"
                id="granted-role"
                options={[
                  { value: 'user', label: 'User' },
                  { value: 'premium', label: 'Premium User' },
                  { value: 'contributor', label: 'Contributor' },
                  { value: 'moderator', label: 'Moderator' },
                ]}
                defaultValue="user"
              />
              <Input
                label="Bonus Credits"
                id="bonus-credits"
                type="number"
                min={0}
                defaultValue="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary & Generate */}
        <div className="space-y-6">
          {/* Generated Code Preview */}
          <div className="card">
            <h3 className="card-title mb-3">Generated Code</h3>
            {generatedCode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <span className="text-lg font-mono font-bold text-admin-400 tracking-wider">
                    {generatedCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-colors"
                    title="Copy code"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-400 text-center">Copied to clipboard!</p>
                )}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
                  <Hash className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 mb-1">No code generated yet</p>
                <p className="text-xs text-slate-600">Configure the invite settings and click generate</p>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="card">
            <h3 className="card-title mb-3">Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Type</span>
                <span className="text-slate-200 capitalize">{inviteType}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Max Uses</span>
                <span className="text-slate-200">{maxUses || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Expiry</span>
                <span className="text-slate-200">
                  {expiryPreset === 'custom' && customExpiryDate
                    ? customExpiryDate
                    : expiryOptions.find(o => o.value === expiryPreset)?.label || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Email Verification</span>
                <Badge variant={requireEmailVerification ? 'success' : 'default'} dot>
                  {requireEmailVerification ? 'Required' : 'Optional'}
                </Badge>
              </div>
              {description && (
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-300 line-clamp-2">{description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="card">
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={generateCode}
                disabled={!isFormValid}
              >
                <RefreshCw className="w-4 h-4" />
                Generate Invite Code
              </Button>
              <Link href="/invites">
                <Button variant="ghost" className="w-full" size="sm">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>

          {/* Info Card */}
          <div className="card bg-sky-500/5 border-sky-500/20">
            <h3 className="card-title text-sky-400 mb-2">How Invites Work</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-sky-400 mt-0.5">•</span>
                Generated codes are single-use by default
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-400 mt-0.5">•</span>
                Set a max uses limit to control distribution
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-400 mt-0.5">•</span>
                Expired codes cannot be redeemed by users
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-400 mt-0.5">•</span>
                Email verification adds a security layer
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-400 mt-0.5">•</span>
                You can revoke active codes anytime from the invites page
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
