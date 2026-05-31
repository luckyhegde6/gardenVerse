'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  MessageSquare,
  Flag,
  Shield,
  MapPin,
  Calendar,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Modal, ModalFooter } from '@/components/Modal'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import api from '@/lib/api'

interface CommunityGroup {
  id: string
  name: string
  members: number
  posts: number
  status: string
  created: string
}

interface NearbyGardener {
  id: string
  username: string
  location: string
  gardens: number
  joinedAt: string
}

interface CommunityReport {
  id: string
  targetUser: string
  reason: string
  reporter: string
  status: string
  date: string
}

// ── Page Component ────────────────────────────────────────

export default function CommunityPage() {
  const [tab, setTab] = useState('groups')

  // Report action modal state
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'dismiss' | 'warn' | 'suspend' | 'ban'>('warn')

  // API data states
  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [gardeners, setGardeners] = useState<NearbyGardener[]>([])
  const [reports, setReports] = useState<CommunityReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [groupsRes, gardenersRes, reportsRes] = await Promise.all([
        api.get('/community/groups', { params: { limit: 50 } }),
        api.get('/geo/nearby', { params: { limit: 50 } }),
        api.get('/moderation/reports', { params: { limit: 50 } }),
      ])

      const mapGroups = (res: unknown): CommunityGroup[] => {
        const r = res as { data?: { data?: CommunityGroup[] } }
        if (Array.isArray(r.data?.data)) return r.data.data
        const r2 = res as { data?: CommunityGroup[] }
        if (Array.isArray(r2.data)) return r2.data
        return []
      }

      const mapGardeners = (res: unknown): NearbyGardener[] => {
        const r = res as { data?: { data?: NearbyGardener[] } }
        if (Array.isArray(r.data?.data)) return r.data.data
        const r2 = res as { data?: NearbyGardener[] }
        if (Array.isArray(r2.data)) return r2.data
        const r3 = res as { gardeners?: NearbyGardener[] }
        if (Array.isArray(r3.gardeners)) return r3.gardeners
        return []
      }

      const mapReports = (res: unknown): CommunityReport[] => {
        const r = res as { data?: { reports?: CommunityReport[] } }
        if (Array.isArray(r.data?.reports)) return r.data.reports
        const r2 = res as { reports?: CommunityReport[] }
        if (Array.isArray(r2.reports)) return r2.reports
        return []
      }

      setGroups(mapGroups(groupsRes))
      setGardeners(mapGardeners(gardenersRes))
      setReports(mapReports(reportsRes))
    } catch {
      setError('Could not load community data from server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const pendingReports = reports.filter(r => r.status === 'pending').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading community data...</p>
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
          <Button variant="ghost" size="sm" onClick={fetchAll}>Retry</Button>
        </div>
      )}

      {/* ── Stats Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Groups"
          value={groups.length}
          change={4.5}
          trend="up"
          icon={<Users className="w-6 h-6" />}
          changeLabel="this month"
        />
        <StatCard
          title="Active Members"
          value={45200}
          change={7.2}
          trend="up"
          icon={<UserPlus className="w-6 h-6" />}
          changeLabel="vs last week"
        />
        <StatCard
          title="Reports Today"
          value={12}
          change={-8.3}
          trend="down"
          icon={<Flag className="w-6 h-6" />}
          changeLabel="vs yesterday"
        />
        <StatCard
          title="Pending Reports"
          value={pendingReports}
          change={-5}
          trend="down"
          icon={<AlertTriangle className="w-6 h-6" />}
          changeLabel="vs last week"
        />
      </div>

      {/* ── Tabs ──────────────────────────────────────── */}
      <TabsRoot value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="groups">Community Groups</TabsTrigger>
            <TabsTrigger value="nearby">Nearby Gardeners</TabsTrigger>
            <TabsTrigger value="reports">
              Reports
              {pendingReports > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-400/20 text-red-400 text-xs">
                  {pendingReports}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <Badge variant="info">Live</Badge>
        </div>

        {/* ── Groups Tab ──────────────────────────────── */}
        <TabsContent value="groups">
          <div className="card">
            <DataTable
              columns={[
                { key: 'name', header: 'Name', sortable: true },
                {
                  key: 'members',
                  header: 'Members Count',
                  sortable: true,
                  width: '140px',
                },
                {
                  key: 'posts',
                  header: 'Posts Count',
                  sortable: true,
                  width: '120px',
                },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  width: '100px',
                  render: g => (
                    <Badge
                      variant={g.status as 'active' | 'flagged' | 'suspended'}
                      dot
                    >
                      {g.status as string}
                    </Badge>
                  ),
                },
              ]}
              data={groups as unknown as Record<string, unknown>[]}
              keyExtractor={g => String(g.id)}
              searchable
              searchPlaceholder="Search groups..."
              pageSize={8}
              emptyMessage="No community groups found."
            />
          </div>
        </TabsContent>

        {/* ── Nearby Gardeners Tab ────────────────────── */}
        <TabsContent value="nearby">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-slate-500" />
              <h3 className="card-title text-sm">Nearby Gardeners</h3>
            </div>
            <DataTable
              columns={[
                { key: 'username', header: 'Username', sortable: true },
                { key: 'location', header: 'Location', sortable: true },
                {
                  key: 'gardens',
                  header: 'Garden Count',
                  sortable: true,
                  width: '120px',
                },
                {
                  key: 'joinedAt',
                  header: 'Join Date',
                  sortable: true,
                  width: '120px',
                  render: g => (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {g.joinedAt as string}
                    </span>
                  ),
                },
              ]}
              data={gardeners as unknown as Record<string, unknown>[]}
              keyExtractor={g => String(g.id)}
              searchable
              searchPlaceholder="Search gardeners..."
              pageSize={7}
              emptyMessage="No nearby gardeners found."
            />
          </div>
        </TabsContent>

        {/* ── Reports Tab ─────────────────────────────── */}
        <TabsContent value="reports">
          <div className="card">
            <DataTable
              columns={[
                { key: 'targetUser', header: 'Reported User', sortable: true },
                { key: 'reason', header: 'Reason', sortable: true },
                { key: 'reporter', header: 'Reporter', sortable: true },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  width: '110px',
                  render: r => (
                    <Badge
                      variant={
                        r.status as
                          | 'pending'
                          | 'resolved'
                          | 'dismissed'
                          | 'flagged'
                      }
                      dot
                    >
                      {r.status as string}
                    </Badge>
                  ),
                },
                { key: 'date', header: 'Date', sortable: true, width: '110px' },
                {
                  key: 'actions',
                  header: '',
                  width: '80px',
                  render: r => (
                    <Button
                      size="sm"
                      variant={
                        (r.status as string) === 'resolved' ||
                        (r.status as string) === 'dismissed'
                          ? 'ghost'
                          : 'secondary'
                      }
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedReport(r as unknown as CommunityReport)
                        setShowActionModal(true)
                      }}
                      disabled={
                        (r.status as string) === 'resolved' ||
                        (r.status as string) === 'dismissed'
                      }
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Action
                    </Button>
                  ),
                },
              ]}
              data={reports as unknown as Record<string, unknown>[]}
              keyExtractor={r => String(r.id)}
              searchable
              searchPlaceholder="Search reports..."
              onRowClick={r =>
                setSelectedReport(r as unknown as CommunityReport)
              }
              pageSize={8}
              emptyMessage="No reports found."
            />
          </div>
        </TabsContent>
      </TabsRoot>

      {/* ── Report Detail Modal ──────────────────────── */}
      {selectedReport && !showActionModal && (
        <Modal
          open={!!selectedReport}
          onOpenChange={o => !o && setSelectedReport(null)}
          title="Report Details"
          description={`Reported user: @${selectedReport.targetUser}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Reported User</p>
                <p className="text-sm text-slate-200">
                  @{selectedReport.targetUser}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Reporter</p>
                <p className="text-sm text-slate-200">
                  @{selectedReport.reporter}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <Badge
                  variant={
                    selectedReport.status as
                      | 'pending'
                      | 'resolved'
                      | 'dismissed'
                      | 'flagged'
                  }
                  dot
                >
                  {selectedReport.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="text-sm text-slate-200">
                  {selectedReport.date}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Reason</p>
              <p className="text-sm text-slate-300 bg-slate-800/30 rounded-lg p-3">
                {selectedReport.reason}
              </p>
            </div>
            {selectedReport.status === 'pending' && (
              <ModalFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setActionType('dismiss')
                    setShowActionModal(true)
                  }}
                >
                  <XCircle className="w-4 h-4" /> Dismiss
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActionType('warn')
                    setShowActionModal(true)
                  }}
                >
                  <AlertTriangle className="w-4 h-4" /> Warn
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setActionType('suspend')
                    setShowActionModal(true)
                  }}
                >
                  <Shield className="w-4 h-4" /> Suspend
                </Button>
              </ModalFooter>
            )}
          </div>
        </Modal>
      )}

      {/* ── Action Confirmation Modal ────────────────── */}
      <Modal
        open={showActionModal}
        onOpenChange={o => setShowActionModal(o)}
        title={
          actionType === 'dismiss'
            ? 'Dismiss Report'
            : actionType === 'warn'
              ? 'Warn User'
              : actionType === 'suspend'
                ? 'Suspend User'
                : 'Ban User'
        }
        description={
          selectedReport ? `@${selectedReport.targetUser}` : undefined
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
            {actionType === 'dismiss' ? (
              <CheckCircle className="w-5 h-5 text-slate-400 mt-0.5" />
            ) : actionType === 'warn' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            ) : (
              <Shield className="w-5 h-5 text-red-400 mt-0.5" />
            )}
            <div>
              <p className="text-sm text-slate-200">
                {actionType === 'dismiss'
                  ? 'This report will be marked as dismissed with no action taken.'
                  : actionType === 'warn'
                    ? 'The user will receive a warning about their behavior.'
                    : actionType === 'suspend'
                      ? 'The user will be suspended for 7 days.'
                      : 'The user will be permanently banned from the platform.'}
              </p>
              {selectedReport && (
                <p className="text-xs text-slate-500 mt-1">
                  Reason: {selectedReport.reason}
                </p>
              )}
            </div>
          </div>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowActionModal(false)
                setSelectedReport(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'dismiss' ? 'ghost' : actionType === 'warn' ? 'secondary' : 'danger'}
              onClick={() => {
                setShowActionModal(false)
                setSelectedReport(null)
              }}
            >
              {actionType === 'dismiss'
                ? 'Dismiss Report'
                : actionType === 'warn'
                  ? 'Send Warning'
                  : actionType === 'suspend'
                    ? 'Suspend User'
                    : 'Ban User'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
