'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Plus, AlertCircle, CheckCircle, Loader2,
  Edit3, Play, XCircle, Archive,
} from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import api from '@/lib/api'

interface SeasonEvent {
  id: string
  key: string
  name: string
  description: string | null
  type: string
  status: string
  startDate: string
  endDate: string
  icon: string | null
  bannerUrl: string | null
  themeColor: string | null
  shopItemCount: number
  participantCount: number
  createdAt: string
  updatedAt: string
}

const TABS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'PAST', label: 'Past' },
  { value: 'ALL', label: 'All Events' },
]

const STATUS_VARIANTS: Record<string, 'success' | 'info' | 'default' | 'error' | 'warning'> = {
  ACTIVE: 'success',
  UPCOMING: 'info',
  DRAFT: 'warning',
  PAST: 'default',
  CANCELLED: 'error',
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const defaultForm = {
  key: '', name: '', description: '', type: 'SEASONAL', status: 'DRAFT',
  startDate: '', endDate: '', icon: '', bannerUrl: '', themeColor: '',
}

export default function EventsPage() {
  const [events, setEvents] = useState<SeasonEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [tab, setTab] = useState('ACTIVE')

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingEvent, setEditingEvent] = useState<SeasonEvent | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const statusParam = tab === 'UPCOMING' ? 'UPCOMING' : tab === 'ALL' ? 'ALL' : tab
      const res = await api.get('/events', { params: { status: statusParam, limit: 50 } })
      const body = res.data as { data?: SeasonEvent[] }
      setEvents(body.data || [])
    } catch {
      setError('Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  useEffect(() => {
    if (successMsg) { const t = setTimeout(() => setSuccessMsg(null), 4000); return () => clearTimeout(t) }
  }, [successMsg])

  const resetForm = () => setForm(defaultForm)

  const handleCreate = async () => {
    if (!form.key || !form.name || !form.startDate || !form.endDate) { setError('key, name, startDate, and endDate are required'); return }
    setSaving(true)
    setError(null)
    try {
      await api.post('/events', {
        ...form,
        description: form.description || undefined,
        icon: form.icon || undefined,
        bannerUrl: form.bannerUrl || undefined,
        themeColor: form.themeColor || undefined,
      })
      setSuccessMsg(`Event "${form.name}" created`)
      setShowCreate(false)
      resetForm()
      fetchEvents()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingEvent) return
    setSaving(true)
    setError(null)
    try {
      await api.patch('/events', { id: editingEvent.id, ...form })
      setSuccessMsg(`Event "${form.name}" updated`)
      setShowEdit(false)
      setEditingEvent(null)
      fetchEvents()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (event: SeasonEvent) => {
    setEditingEvent(event)
    setForm({
      key: event.key,
      name: event.name,
      description: event.description || '',
      type: event.type,
      status: event.status,
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate.slice(0, 16),
      icon: event.icon || '',
      bannerUrl: event.bannerUrl || '',
      themeColor: event.themeColor || '',
    })
    setShowEdit(true)
  }

  const quickStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch('/events', { id, status: newStatus })
      setSuccessMsg(`Event status changed to ${newStatus}`)
      fetchEvents()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status')
    }
  }

  const statusActions = (event: SeasonEvent) => {
    const actions: { label: string; status: string; icon: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger' }[] = []
    if (event.status === 'DRAFT') actions.push({ label: 'Activate', status: 'ACTIVE', icon: <Play className="w-3.5 h-3.5" />, variant: 'primary' })
    if (event.status === 'ACTIVE') actions.push({ label: 'Archive', status: 'PAST', icon: <Archive className="w-3.5 h-3.5" />, variant: 'secondary' })
    if (event.status === 'ACTIVE' || event.status === 'UPCOMING') actions.push({ label: 'Cancel', status: 'CANCELLED', icon: <XCircle className="w-3.5 h-3.5" />, variant: 'danger' })
    if (event.status === 'CANCELLED' || event.status === 'PAST') actions.push({ label: 'Reopen Draft', status: 'DRAFT', icon: <Edit3 className="w-3.5 h-3.5" />, variant: 'secondary' })
    return actions
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Events</h2>
        </div>
        <Button variant="primary" onClick={() => { resetForm(); setShowCreate(true) }}>
          <Plus className="w-4 h-4" /> Create Event
        </Button>
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

      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-slate-500">
              <Calendar className="w-12 h-12" />
              <p className="text-sm">No events found</p>
              <Button variant="secondary" size="sm" onClick={() => { resetForm(); setShowCreate(true) }}>
                <Plus className="w-4 h-4" /> Create First Event
              </Button>
            </div>
          ) : (
            <div className="card">
              <DataTable
                columns={[
                  { key: 'name', header: 'Name', sortable: true, render: t => (
                    <span className="font-medium text-slate-200 flex items-center gap-2">
                      {(t as any).icon && <span>{(t as any).icon}</span>}
                      {(t as any).name}
                    </span>
                  )},
                  { key: 'key', header: 'Key', width: '110px', render: t => (
                    <code className="text-xs text-slate-400 font-mono">{(t as any).key}</code>
                  )},
                  { key: 'type', header: 'Type', width: '90px' },
                  { key: 'status', header: 'Status', width: '90px', render: t => (
                    <Badge variant={STATUS_VARIANTS[(t as any).status] || 'default'} dot>{(t as any).status}</Badge>
                  )},
                  { key: 'startDate', header: 'Start', sortable: true, width: '110px', render: t => (
                    <span className="text-sm text-slate-400">{formatDate((t as any).startDate)}</span>
                  )},
                  { key: 'endDate', header: 'End', sortable: true, width: '110px', render: t => (
                    <span className="text-sm text-slate-400">{formatDate((t as any).endDate)}</span>
                  )},
                  { key: 'shopItemCount', header: 'Items', width: '60px', render: t => (
                    <Badge variant="info">{(t as any).shopItemCount}</Badge>
                  )},
                  { key: 'participantCount', header: 'Users', width: '60px', render: t => (
                    <Badge variant="default">{(t as any).participantCount}</Badge>
                  )},
                  { key: 'actions', header: 'Actions', width: '100px', render: t => {
                    const event = t as unknown as SeasonEvent
                    return (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(event)}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        {statusActions(event).map((a, i) => (
                          <Button key={i} variant={a.variant || 'secondary'} size="sm" onClick={() => quickStatusChange(event.id, a.status)}>
                            {a.icon}
                          </Button>
                        ))}
                      </div>
                    )
                  }},
                ]}
                data={events as unknown as Record<string, unknown>[]}
                keyExtractor={t => String((t as any).id)}
                searchable
                searchPlaceholder="Search events..."
                pageSize={20}
              />
            </div>
          )}
        </TabsContent>
      </TabsRoot>

      <Modal open={showCreate} onOpenChange={o => { if (!o) { setShowCreate(false); resetForm() } }} title="Create Event" description="Add a new seasonal event" className="max-w-xl">
        <EventForm form={form} onChange={setForm} />
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setShowCreate(false); resetForm() }}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleCreate}><Plus className="w-4 h-4" /> Create Event</Button>
        </ModalFooter>
      </Modal>

      <Modal open={showEdit} onOpenChange={o => { if (!o) { setShowEdit(false); setEditingEvent(null) } }} title="Edit Event" description={editingEvent?.name || ''} className="max-w-xl">
        <EventForm form={form} onChange={setForm} />
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setShowEdit(false); setEditingEvent(null) }}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleEdit}><Edit3 className="w-4 h-4" /> Save Changes</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

function EventForm({ form, onChange }: { form: typeof defaultForm; onChange: (f: typeof defaultForm) => void }) {
  const set = (key: string, value: string) => onChange({ ...form, [key]: value })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input id="event-key" label="Key" value={form.key} onChange={e => set('key', e.target.value)} placeholder="summer-fest-2026" />
        <Input id="event-name" label="Name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Summer Festival" />
      </div>
      <Input id="event-desc" label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Event description..." />
      <div className="grid grid-cols-2 gap-4">
        <Select
          id="event-type" label="Type"
          options={[{ value: 'SEASONAL', label: 'Seasonal' }, { value: 'SPECIAL', label: 'Special' }, { value: 'LIMITED', label: 'Limited Time' }]}
          value={form.type} onChange={e => set('type', e.target.value)}
        />
        <Select
          id="event-status" label="Status"
          options={[{ value: 'DRAFT', label: 'Draft' }, { value: 'ACTIVE', label: 'Active' }, { value: 'UPCOMING', label: 'Upcoming' }]}
          value={form.status} onChange={e => set('status', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input id="event-start" label="Start Date" type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        <Input id="event-end" label="End Date" type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input id="event-icon" label="Icon (emoji)" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🎉" />
        <Input id="event-banner" label="Banner URL" value={form.bannerUrl} onChange={e => set('bannerUrl', e.target.value)} placeholder="https://..." />
        <Input id="event-color" label="Theme Color" value={form.themeColor} onChange={e => set('themeColor', e.target.value)} placeholder="#FF6B35" />
      </div>
    </div>
  )
}
