'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bell, Plus, AlertCircle, CheckCircle, Loader2,
  Mail, MailOpen, Trash2, Send, Search, Users,
} from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import api from '@/lib/api'

interface AdminNotification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
  user: { id: string; username: string; email: string }
}

interface SimpleUser {
  id: string
  username: string
  displayName: string
}

const NOTIFICATION_TYPES = ['SYSTEM', 'MARKETPLACE', 'GARDEN', 'ACHIEVEMENT', 'WEATHER', 'COMMUNITY', 'ADMIN']

function typeBadgeVariant(t: string): 'info' | 'success' | 'warning' | 'error' | 'default' {
  const map: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
    SYSTEM: 'default', MARKETPLACE: 'success', GARDEN: 'info',
    ACHIEVEMENT: 'warning', WEATHER: 'info', COMMUNITY: 'default', ADMIN: 'warning',
  }
  return map[t] || 'default'
}

function formatDate(d: string): string {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  const [typeFilter, setTypeFilter] = useState('')
  const [readFilter, setReadFilter] = useState('all')

  const [users, setUsers] = useState<SimpleUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')

  const [showCompose, setShowCompose] = useState(false)
  const [composeForm, setComposeForm] = useState({ userId: '', type: 'ADMIN', title: '', body: '' })
  const [sending, setSending] = useState(false)

  const [showDetail, setShowDetail] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = { limit: '50' }
      if (selectedUserId) params.userId = selectedUserId
      if (typeFilter) params.type = typeFilter
      if (readFilter === 'unread') params.unreadOnly = 'true'
      const res = await api.get('/notifications', { params })
      const body = res.data as { notifications: AdminNotification[]; total: number; unreadCount: number }
      setNotifications(body.notifications || [])
      setTotal(body.total || 0)
      setUnreadCount(body.unreadCount || 0)
    } catch {
      setError('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [selectedUserId, typeFilter, readFilter])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  useEffect(() => {
    if (successMsg) { const t = setTimeout(() => setSuccessMsg(null), 4000); return () => clearTimeout(t) }
  }, [successMsg])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users', { params: { limit: 200 } })
        const body = res.data as { data?: Record<string, unknown>[] }
        if (body?.data) {
          setUsers(body.data.map(u => ({
            id: u.id as string,
            username: u.username as string,
            displayName: (u.displayName as string) || (u.username as string),
          })))
        }
      } catch {}
    }
    fetchUsers()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setSuccessMsg('All notifications marked as read')
      fetchNotifications()
    } catch {
      setError('Failed to mark all as read')
    }
  }

  const handleMarkRead = async (id: string, currentRead: boolean) => {
    try {
      await api.post(`/notifications/${id}/read`)
      fetchNotifications()
    } catch {
      setError('Failed to update notification')
    }
  }

  const handleSend = async () => {
    if (!composeForm.title || !composeForm.body) { setError('Title and body are required'); return }
    setSending(true)
    setError(null)
    try {
      if (composeForm.userId === 'ALL') {
        const res = await api.get('/users', { params: { limit: 500 } })
        const body = res.data as { data?: Record<string, unknown>[] }
        const allUsers = body?.data || []
        await Promise.all(allUsers.map(u =>
          api.post('/notifications', {
            userId: u.id,
            type: composeForm.type || 'ADMIN',
            title: composeForm.title,
            body: composeForm.body,
          }).catch(() => {})
        ))
        setSuccessMsg(`Notification sent to ${allUsers.length} users`)
      } else {
        await api.post('/notifications', {
          userId: composeForm.userId,
          type: composeForm.type || 'ADMIN',
          title: composeForm.title,
          body: composeForm.body,
        })
        setSuccessMsg('Notification sent')
      }
      setShowCompose(false)
      setComposeForm({ userId: '', type: 'ADMIN', title: '', body: '' })
      fetchNotifications()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const typeCounts = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Notification Center</h2>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
              <MailOpen className="w-4 h-4" /> Mark All Read
            </Button>
          )}
          <Button variant="primary" onClick={() => { setComposeForm({ userId: '', type: 'ADMIN', title: '', body: '' }); setShowCompose(true) }}>
            <Send className="w-4 h-4" /> Send Notification
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Notifications" value={total} icon={<Bell className="w-6 h-6" />} />
        <StatCard title="Unread" value={unreadCount} icon={<Mail className="w-6 h-6" />} />
        {Object.entries(typeCounts).slice(0, 2).map(([type, count]) => (
          <StatCard key={type} title={type} value={count} icon={<Bell className="w-6 h-6" />} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-slate-800/20 border border-slate-700/40">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Filters:</span>
        </div>
        <Select
          options={[
            { value: '', label: 'All Users' },
            ...users.map(u => ({ value: u.id, label: `${u.displayName} (@${u.username})` })),
          ]}
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          className="w-48"
        />
        <Select
          options={[
            { value: '', label: 'All Types' },
            ...NOTIFICATION_TYPES.map(t => ({ value: t, label: t })),
          ]}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="w-36"
        />
        <Select
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'unread', label: 'Unread Only' },
            { value: 'read', label: 'Read Only' },
          ]}
          value={readFilter}
          onChange={e => setReadFilter(e.target.value)}
          className="w-32"
        />
        {(selectedUserId || typeFilter || readFilter !== 'all') && (
          <button onClick={() => { setSelectedUserId(''); setTypeFilter(''); setReadFilter('all') }} className="text-xs text-slate-400 hover:text-slate-200 underline">
            Clear filters
          </button>
        )}
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-slate-500">
            <Bell className="w-12 h-12" />
            <p className="text-sm">No notifications found</p>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'createdAt', header: 'Time', sortable: true, width: '140px', render: t => (
                <span className="text-xs text-slate-400">{formatDate((t as any).createdAt)}</span>
              )},
              { key: 'user', header: 'User', width: '120px', render: t => {
                const u = (t as any).user
                return <span className="text-sm text-slate-300">@{u?.username || '—'}</span>
              }},
              { key: 'type', header: 'Type', width: '100px', render: t => (
                <Badge variant={typeBadgeVariant((t as any).type)}>{(t as any).type}</Badge>
              )},
              { key: 'title', header: 'Title', render: t => (
                <span className="text-sm font-medium text-slate-200">{(t as any).title}</span>
              )},
              { key: 'body', header: 'Body', render: t => (
                <span className="text-xs text-slate-400 truncate block max-w-xs">{(t as any).body}</span>
              )},
              { key: 'isRead', header: 'Status', width: '80px', render: t => (
                <Badge variant={(t as any).isRead ? 'default' : 'info'} dot>
                  {(t as any).isRead ? 'Read' : 'Unread'}
                </Badge>
              )},
              { key: 'actions', header: '', width: '50px', render: t => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleMarkRead((t as any).id, (t as any).isRead) }}>
                  {(t as any).isRead ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                </Button>
              )},
            ]}
            data={notifications as unknown as Record<string, unknown>[]}
            keyExtractor={t => String((t as any).id)}
            onRowClick={t => {
              setSelectedNotif(t as unknown as AdminNotification)
              setShowDetail(true)
            }}
            pageSize={20}
          />
        )}
      </div>

      <Modal open={showCompose} onOpenChange={o => { if (!o) setShowCompose(false) }} title="Send Notification" description="Send a notification to users" className="max-w-xl">
        <div className="space-y-4">
          <Select
            id="notif-user" label="Target User"
            options={[
              { value: '', label: 'Select a user...' },
              { value: 'ALL', label: '📢 All Users' },
              ...users.map(u => ({ value: u.id, label: `${u.displayName} (@${u.username})` })),
            ]}
            value={composeForm.userId}
            onChange={e => setComposeForm(f => ({ ...f, userId: e.target.value }))}
          />
          <Select
            id="notif-type" label="Type"
            options={NOTIFICATION_TYPES.map(t => ({ value: t, label: t }))}
            value={composeForm.type}
            onChange={e => setComposeForm(f => ({ ...f, type: e.target.value }))}
          />
          <Input id="notif-title" label="Title" value={composeForm.title} onChange={e => setComposeForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title" />
          <Input id="notif-body" label="Body" value={composeForm.body} onChange={e => setComposeForm(f => ({ ...f, body: e.target.value }))} placeholder="Notification body text" />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowCompose(false)}>Cancel</Button>
          <Button variant="primary" loading={sending} onClick={handleSend} disabled={!composeForm.userId || !composeForm.title || !composeForm.body}>
            <Send className="w-4 h-4" /> Send
          </Button>
        </ModalFooter>
      </Modal>

      {selectedNotif && (
        <Modal
          open={showDetail}
          onOpenChange={o => { if (!o) { setShowDetail(false); setSelectedNotif(null) } }}
          title={selectedNotif.title}
          description={`to @${selectedNotif.user?.username} — ${formatDate(selectedNotif.createdAt)}`}
          className="max-w-lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={typeBadgeVariant(selectedNotif.type)}>{selectedNotif.type}</Badge>
              <Badge variant={selectedNotif.isRead ? 'default' : 'info'} dot>
                {selectedNotif.isRead ? 'Read' : 'Unread'}
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedNotif.body}</p>
            </div>
            <div className="text-sm text-slate-500">
              <p>User: <span className="text-slate-300">@{selectedNotif.user?.username} ({selectedNotif.user?.email})</span></p>
              <p className="mt-1">Sent: <span className="text-slate-300">{new Date(selectedNotif.createdAt).toLocaleString()}</span></p>
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => { setShowDetail(false); setSelectedNotif(null) }}>Close</Button>
              <Button variant="secondary" onClick={() => { handleMarkRead(selectedNotif.id, selectedNotif.isRead); setShowDetail(false) }}>
                {selectedNotif.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                {selectedNotif.isRead ? 'Mark Unread' : 'Mark Read'}
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  )
}
