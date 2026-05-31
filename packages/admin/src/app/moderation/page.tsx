'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Ban, Shield, AlertCircle, CheckCircle, XCircle, Clock, UserX, Loader2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import { formatRelativeTime } from '@/lib/utils'
import api, { type Report } from '@/lib/api'

interface BackendReport {
  id: string
  type: string
  status: string
  description: string | null
  reporterId: string
  reporter: { id: string; username: string }
  actionedById: string | null
  actionedBy: { id: string; username: string } | null
  actionTaken: string | null
  createdAt: string
  resolvedAt: string | null
}

interface AutoModStat {
  name: string
  value: number
  change: string
  trend: 'up' | 'down'
}

interface RecentAction {
  action: string
  target: string
  moderator: string
  reason: string
  time: string
}

function mapBackendReport(r: BackendReport): Report {
  const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    SPAM: 'low',
    ABUSE: 'high',
    HARASSMENT: 'high',
    SCAM: 'critical',
    FRAUD: 'critical',
    INAPPROPRIATE: 'medium',
  }

  return {
    id: r.id,
    type: r.type,
    status: r.status.toLowerCase() as Report['status'],
    priority: r.type ? (priorityMap[r.type] || 'medium') : 'medium',
    reporterId: r.reporterId,
    reporterName: r.reporter?.username || 'Unknown',
    targetId: '',
    targetName: '',
    reason: r.type,
    description: r.description || '',
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt || undefined,
    resolvedBy: r.actionedBy?.username || undefined,
    action: r.actionTaken || undefined,
  }
}

export default function ModerationPage() {
  const [tab, setTab] = useState('pending')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'warn' | 'suspend' | 'ban' | 'dismiss'>('warn')

  const [reports, setReports] = useState<Report[]>([])
  const [autoModStats, setAutoModStats] = useState<AutoModStat[] | null>(null)
  const [recentActions, setRecentActions] = useState<RecentAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [reportsRes, statsRes, actionsRes] = await Promise.allSettled([
        api.get('/moderation/reports', { params: { limit: 50 } }),
        api.get('/moderation/stats'),
        api.get('/moderation/actions'),
      ])

      if (reportsRes.status === 'fulfilled') {
        const body = reportsRes.value.data as { reports: BackendReport[]; total: number }
        const mapped: Report[] = (body.reports || []).map(mapBackendReport)
        setReports(mapped)
      } else {
        console.error('Failed to fetch reports:', reportsRes.reason)
        setError('Failed to load reports from server.')
      }

      if (statsRes.status === 'fulfilled') {
        const statsData = statsRes.value.data as AutoModStat[]
        setAutoModStats(statsData)
      }

      if (actionsRes.status === 'fulfilled') {
        const actionsData = actionsRes.value.data as RecentAction[]
        setRecentActions(actionsData)
      }
    } catch (err) {
      console.error('Failed to fetch moderation data:', err)
      setError('Failed to load moderation data from server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const filtered = reports.filter(r => r.status === tab)

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchReports}>
            Retry
          </Button>
        </div>
      )}

      {/* Auto-mod stats — only renders when API data is available */}
      {autoModStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {autoModStats.map(stat => (
            <div key={stat.name} className="card">
              <p className="text-sm text-slate-400">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{stat.value.toLocaleString()}</p>
              <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.change} vs yesterday
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <TabsRoot value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Report Queue</h3>
              <TabsList>
                <TabsTrigger value="pending">
                  Pending
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-xs">
                    {reports.filter(r => r.status === 'pending').length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={tab}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500">No {tab} reports.</p>
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'priority',
                      header: '',
                      width: '60px',
                      render: r => {
                        const p = r.priority as string
                        const Icon = p === 'critical' ? AlertCircle : p === 'high' ? AlertTriangle : Clock
                        return (
                          <Icon className={`w-4 h-4 ${
                            p === 'critical' ? 'text-red-400' : p === 'high' ? 'text-amber-400' : 'text-slate-500'
                          }`} />
                        )
                      },
                    },
                    { key: 'type', header: 'Type', sortable: true },
                    {
                      key: 'priority',
                      header: 'Priority',
                      sortable: true,
                      width: '90px',
                      render: r => (
                        <Badge variant={r.priority === 'critical' ? 'error' : r.priority === 'high' ? 'warning' : 'default'}>
                          {r.priority as string}
                        </Badge>
                      ),
                    },
                    { key: 'reporterName', header: 'Reporter', sortable: true },
                    { key: 'targetName', header: 'Target', sortable: true },
                    { key: 'reason', header: 'Reason', sortable: true },
                    {
                      key: 'createdAt',
                      header: 'Reported',
                      sortable: true,
                      width: '120px',
                      render: r => formatRelativeTime(r.createdAt as string),
                    },
                  ]}
                  data={filtered as unknown as Record<string, unknown>[]}
                  keyExtractor={r => String(r.id)}
                  searchable
                  searchPlaceholder="Search reports..."
                  onRowClick={r => setSelectedReport(r as unknown as Report)}
                  pageSize={8}
                />
              )}
            </TabsContent>
          </TabsRoot>
        </div>

        {/* Recent Actions — only renders when API data is available */}
        {recentActions.length > 0 && (
          <div className="card">
            <h3 className="card-title mb-4">Recent Actions</h3>
            <div className="space-y-3">
              {recentActions.map((action, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                  <div className={`p-1.5 rounded-lg ${
                    action.action === 'Banned' ? 'bg-red-400/10 text-red-400' :
                    action.action === 'Suspended' ? 'bg-amber-400/10 text-amber-400' :
                    action.action === 'Warned' ? 'bg-sky-400/10 text-sky-400' :
                    'bg-slate-400/10 text-slate-400'
                  }`}>
                    {action.action === 'Banned' ? <Ban className="w-3.5 h-3.5" /> :
                     action.action === 'Suspended' ? <UserX className="w-3.5 h-3.5" /> :
                     action.action === 'Warned' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                     <XCircle className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">
                      <span className="font-medium">{action.action}</span>{' '}
                      <span className="text-slate-400">@{action.target}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{action.reason}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600">by {action.moderator}</span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-600">{action.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedReport && (
        <Modal
          open={!!selectedReport}
          onOpenChange={o => !o && setSelectedReport(null)}
          title={`Report #${selectedReport.id}`}
          description={selectedReport.type}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Reporter</p>
                <p className="text-sm text-slate-200">@{selectedReport.reporterName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Target</p>
                <p className="text-sm text-slate-200">@{selectedReport.targetName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Priority</p>
                <Badge variant={selectedReport.priority === 'critical' ? 'error' : selectedReport.priority === 'high' ? 'warning' : 'default'}>
                  {selectedReport.priority}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <Badge variant={selectedReport.status as 'pending' | 'resolved' | 'dismissed'}>
                  {selectedReport.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Reason</p>
              <p className="text-sm text-slate-200">{selectedReport.reason}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-300 bg-slate-800/30 rounded-lg p-3">{selectedReport.description}</p>
            </div>
            {selectedReport.resolvedAt && (
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Resolved {formatRelativeTime(selectedReport.resolvedAt)}</span>
                <span>by {selectedReport.resolvedBy}</span>
                <Badge variant="info">{selectedReport.action}</Badge>
              </div>
            )}
            {selectedReport.status === 'pending' && (
              <ModalFooter>
                <Button variant="ghost" onClick={() => { setActionType('dismiss'); setShowActionModal(true) }}>
                  <XCircle className="w-4 h-4" /> Dismiss
                </Button>
                <Button variant="secondary" onClick={() => { setActionType('warn'); setShowActionModal(true) }}>
                  <AlertTriangle className="w-4 h-4" /> Warn
                </Button>
                <Button variant="danger" onClick={() => { setActionType('suspend'); setShowActionModal(true) }}>
                  <Ban className="w-4 h-4" /> Suspend
                </Button>
              </ModalFooter>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
