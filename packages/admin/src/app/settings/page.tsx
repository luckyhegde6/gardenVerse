'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings as SettingsIcon, User, Bell, Shield, Moon, Sun, Camera, Save, Key, Smartphone, Mail, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Toggle } from '@/components/Toggle'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import api from '@/lib/api'

export default function SettingsPage() {
  // Profile state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Theme state
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarCollapsedDefault, setSidebarCollapsedDefault] = useState(false)

  // Active tab
  const [activeTab, setActiveTab] = useState('profile')

  const [saved, setSaved] = useState(false)

  // Loading / error state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await api.get('/users/me')
      const data = res.data as { username?: string; email?: string; displayName?: string; bio?: string }
      if (data.displayName) setName(data.displayName)
      else if (data.username) setName(data.username)
      if (data.email) setEmail(data.email)
      if (data.bio) setBio(data.bio)
    } catch {
      setError('Could not load profile from server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSaveProfile = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChangePassword = () => {
    setSaved(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setSaved(false), 2000)
  }

  const sections = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'theme', label: 'Appearance', icon: Moon },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>

          </div>
          <Button variant="ghost" size="sm" onClick={fetchProfile}>Retry</Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-admin-500/10">
            <SettingsIcon className="w-5 h-5 text-admin-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Settings</h1>
            <p className="text-sm text-slate-500">Manage your account settings and preferences</p>
          </div>
        </div>
        {saved && (
          <Badge variant="success" dot>Saved</Badge>
        )}
      </div>

      {/* Tabs Navigation */}
      <TabsRoot value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {sections.map(section => {
            const Icon = section.icon
            return (
              <TabsTrigger key={section.value} value={section.value}>
                <Icon className="w-4 h-4" />
                {section.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Profile Picture</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Update your avatar</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-admin-500/20 flex items-center justify-center border-2 border-slate-700/60">
                    <span className="text-2xl font-bold text-admin-400">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-admin-600 hover:bg-admin-500 text-white transition-colors shadow-lg">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">Allowed: JPG, PNG, WebP</p>
                  <p className="text-xs text-slate-500">Max file size: 5MB</p>
                  <Button variant="secondary" size="sm">
                    <Camera className="w-4 h-4" />
                    Upload New Photo
                  </Button>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Personal Information</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Update your profile details</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                />
                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <div className="md:col-span-2">
                  <div className="space-y-1.5">
                    <label htmlFor="bio" className="block text-sm font-medium text-slate-300">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Write a short bio..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500 transition-colors resize-none"
                    />
                  </div>
                </div>
                <div>
                  <Select
                    label="Timezone"
                    id="timezone"
                    options={[
                      { value: 'utc', label: 'UTC (Coordinated Universal Time)' },
                      { value: 'est', label: 'EST (Eastern Standard Time)' },
                      { value: 'cst', label: 'CST (Central Standard Time)' },
                      { value: 'pst', label: 'PST (Pacific Standard Time)' },
                      { value: 'gmt', label: 'GMT (Greenwich Mean Time)' },
                      { value: 'cet', label: 'CET (Central European Time)' },
                    ]}
                    defaultValue="utc"
                  />
                </div>
                <div>
                  <Select
                    label="Language"
                    id="language"
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                      { value: 'pt', label: 'Portuguese' },
                    ]}
                    defaultValue="en"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveProfile}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notification Preferences */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Notification Channels</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Choose how you receive notifications</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-sky-400/10">
                      <Mail className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">Email Notifications</p>
                      <p className="text-xs text-slate-500">Receive updates via email</p>
                    </div>
                  </div>
                  <Toggle
                    pressed={emailNotifications}
                    onPressedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-400/10">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">Push Notifications</p>
                      <p className="text-xs text-slate-500">Browser and mobile push alerts</p>
                    </div>
                  </div>
                  <Toggle
                    pressed={pushNotifications}
                    onPressedChange={setPushNotifications}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-400/10">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">SMS Alerts</p>
                      <p className="text-xs text-slate-500">Critical alerts via text message</p>
                    </div>
                  </div>
                  <Toggle
                    pressed={smsAlerts}
                    onPressedChange={setSmsAlerts}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Digest Preferences</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Control how often you receive summaries</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Weekly Digest</p>
                    <p className="text-xs text-slate-500">Receive a weekly summary of activity</p>
                  </div>
                  <Toggle
                    pressed={weeklyDigest}
                    onPressedChange={setWeeklyDigest}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Marketing Emails</p>
                    <p className="text-xs text-slate-500">Product updates, tips, and promotions</p>
                  </div>
                  <Toggle
                    pressed={marketingEmails}
                    onPressedChange={setMarketingEmails}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Two-Factor Authentication</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Add an extra layer of security to your account</p>
                </div>
                <Badge variant={twoFactorEnabled ? 'success' : 'warning'} dot>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-slate-300">
                    {twoFactorEnabled
                      ? 'Your account is protected with two-factor authentication.'
                      : 'Protect your account with an authenticator app.'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {twoFactorEnabled
                      ? 'Disabling 2FA will make your account less secure.'
                      : 'Use Google Authenticator, Authy, or similar apps.'}
                  </p>
                </div>
                <Toggle
                  pressed={twoFactorEnabled}
                  onPressedChange={setTwoFactorEnabled}
                />
              </div>
            </div>

            {/* Change Password */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Change Password</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Update your account password</p>
                </div>
              </div>
              <div className="space-y-5">
                <Input
                  label="Current Password"
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="New Password"
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Input
                    label="Confirm New Password"
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  <span>At least 8 characters</span>
                  <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  <span>Uppercase letter</span>
                  <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  <span>Number</span>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  >
                    <Key className="w-4 h-4" />
                    Update Password
                  </Button>
                </div>
              </div>
            </div>

            {/* Sessions */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Active Sessions</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Manage your active login sessions</p>
                </div>
                <Badge variant="info">2 active</Badge>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-400/10">
                      <Smartphone className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">Chrome on Windows</p>
                      <p className="text-xs text-slate-500">Current session · Last active now</p>
                    </div>
                  </div>
                  <Badge variant="success" dot>Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-400/10">
                      <Smartphone className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">Safari on macOS</p>
                      <p className="text-xs text-slate-500">Last active 2 days ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Revoke</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Theme / Appearance Settings */}
        <TabsContent value="theme">
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Theme Preferences</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Customize the appearance of the admin panel</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-400/10">
                      {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">Dark Mode</p>
                      <p className="text-xs text-slate-500">Toggle between dark and light themes</p>
                    </div>
                  </div>
                  <Toggle
                    pressed={darkMode}
                    onPressedChange={setDarkMode}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Collapsed Sidebar by Default</p>
                    <p className="text-xs text-slate-500">Start with a minimized sidebar on page load</p>
                  </div>
                  <Toggle
                    pressed={sidebarCollapsedDefault}
                    onPressedChange={setSidebarCollapsedDefault}
                  />
                </div>

                <div className="pt-2">
                  <Select
                    label="Accent Color"
                    id="accent-color"
                    options={[
                      { value: 'admin', label: 'Admin (Default)' },
                      { value: 'emerald', label: 'Emerald Green' },
                      { value: 'sky', label: 'Sky Blue' },
                      { value: 'violet', label: 'Violet' },
                      { value: 'rose', label: 'Rose' },
                    ]}
                    defaultValue="admin"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Layout Preferences</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Configure the dashboard layout</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Default Dashboard View"
                  id="default-view"
                  options={[
                    { value: 'overview', label: 'Overview' },
                    { value: 'analytics', label: 'Analytics' },
                    { value: 'reports', label: 'Reports' },
                  ]}
                  defaultValue="overview"
                />
                <Select
                  label="Items Per Page"
                  id="items-per-page"
                  options={[
                    { value: '10', label: '10 per page' },
                    { value: '25', label: '25 per page' },
                    { value: '50', label: '50 per page' },
                    { value: '100', label: '100 per page' },
                  ]}
                  defaultValue="25"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </TabsRoot>
    </div>
  )
}
