'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, AlertCircle, CheckCircle, MessageSquare, UserCheck, Clock, TicketCheck } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import api, { type SupportTicket } from '@/lib/api'

const statusVariant: Record<string, 'pending' | 'resolved' | 'dismissed' | 'warning' | 'info'> = {
  OPEN: 'pending',
  IN_PROGRESS: 'warning',
  RESOLVED: 'resolved',
  CLOSED: 'dismissed',
}

const priorityVariant: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [tab, setTab] = useState('open')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTickets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (tab !== 'all') params.status = tab === 'open' ? 'OPEN' : tab === 'in_progress' ? 'IN_PROGRESS' : tab === 'resolved' ? 'RESOLVED' : 'CLOSED'
      const res = await api.get('/support/tickets', { params })
      setTickets(res.data.tickets || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load support tickets')
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  const updateStatus = async (newStatus: string) => {
    if (!selectedTicket) return
    setActionLoading(true)
    try {
      await api.put(`/support/tickets/${selectedTicket.id}/status`, {
        status: newStatus,
        adminNotes: adminNotes || undefined,
      })
      setSuccessMsg(`Ticket #${selectedTicket.id.slice(0, 8)} updated to ${newStatus}`)
      setShowDetail(false)
      setSelectedTicket(null)
      setAdminNotes('')
      fetchTickets()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update ticket')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TicketCheck className="w-6 h-6 text-admin-400" />
        <h2 className="text-lg font-semibold text-slate-100">Support Tickets</h2>
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
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-slate-500">
              <MessageSquare className="w-12 h-12" />
              <p className="text-sm">No support tickets found</p>
            </div>
          ) : (
            <div className="card">
              <DataTable
                columns={[
                  {
                    key: 'subject', header: 'Subject', sortable: true,
                    render: t => <span className="font-medium text-slate-200">{(t as any).subject}</span>,
                  },
                  {
                    key: 'user', header: 'User', width: '150px',
                    render: t => {
                      const ticket = t as any
                      return <span className="text-sm text-slate-300">@{ticket.user?.username || ticket.userId?.slice(0, 8)}</span>
                    },
                  },
                  {
                    key: 'status', header: 'Status', width: '110px',
                    render: t => {
                      const s = (t as any).status
                      return <Badge variant={statusVariant[s] || 'default'}>{s}</Badge>
                    },
                  },
                  {
                    key: 'priority', header: 'Priority', width: '90px',
                    render: t => {
                      const p = (t as any).priority
                      return <Badge variant={priorityVariant[p] || 'default'}>{p}</Badge>
                    },
                  },
                  {
                    key: 'assignedTo', header: 'Assigned', width: '120px',
                    render: t => {
                      const a = (t as any).assignedTo
                      return <span className="text-sm text-slate-400">{a ? `@${a.username}` : '-'}</span>
                    },
                  },
                  { key: 'createdAt', header: 'Created', sortable: true, width: '160px' },
                ]}
                data={tickets as unknown as Record<string, unknown>[]}
                keyExtractor={t => String((t as any).id)}
                searchable
                searchPlaceholder="Search tickets..."
                onRowClick={t => {
                  setSelectedTicket(t as unknown as SupportTicket)
                  setAdminNotes((t as any).adminNotes || '')
                  setShowDetail(true)
                }}
                pageSize={20}
              />
            </div>
          )}
        </TabsContent>
      </TabsRoot>

      {selectedTicket && showDetail && (
        <Modal
          open={showDetail}
          onOpenChange={o => { if (!o) { setShowDetail(false); setSelectedTicket(null) } }}
          title={selectedTicket.subject}
          description={`by @${selectedTicket.user?.username} — ${new Date(selectedTicket.createdAt).toLocaleString()}`}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedTicket.message}</p>
            </div>

            <div className="flex gap-3 text-sm">
              <div>
                <span className="text-slate-500">Status: </span>
                <Badge variant={statusVariant[selectedTicket.status] || 'default'}>{selectedTicket.status}</Badge>
              </div>
              <div>
                <span className="text-slate-500">Priority: </span>
                <Badge variant={priorityVariant[selectedTicket.priority] || 'default'}>{selectedTicket.priority}</Badge>
              </div>
              <div>
                <span className="text-slate-500">Contact: </span>
                <span className="text-slate-300">{selectedTicket.user?.email}</span>
              </div>
            </div>

            {selectedTicket.assignedTo && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <UserCheck className="w-4 h-4" />
                Assigned to @{selectedTicket.assignedTo.username}
              </div>
            )}

            {selectedTicket.createdAt && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                Created {new Date(selectedTicket.createdAt).toLocaleString()}
              </div>
            )}

            <Input
              label="Admin Notes"
              id="adminNotes"
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Add internal notes or response..."
            />

            <ModalFooter>
              <Button variant="ghost" onClick={() => { setShowDetail(false); setSelectedTicket(null) }}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => updateStatus('IN_PROGRESS')}
                loading={actionLoading}
                disabled={selectedTicket.status === 'IN_PROGRESS'}
              >
                <Clock className="w-4 h-4" /> Mark In Progress
              </Button>
              <Button
                variant="primary"
                onClick={() => updateStatus('RESOLVED')}
                loading={actionLoading}
                disabled={selectedTicket.status === 'RESOLVED'}
              >
                <CheckCircle className="w-4 h-4" /> Resolve
              </Button>
              <Button
                variant="danger"
                onClick={() => updateStatus('CLOSED')}
                loading={actionLoading}
                disabled={selectedTicket.status === 'CLOSED'}
              >
                Close
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  )
}
