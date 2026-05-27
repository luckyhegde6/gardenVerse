'use client'

import { useState } from 'react'
import { AlertTriangle, Ban, Shield, AlertCircle, CheckCircle, XCircle, Clock, UserX } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import { StatCard } from '@/components/StatCard'
import { formatRelativeTime } from '@/lib/utils'

const mockReports = [
  { id: 'r1', type: 'Harassment', status: 'pending', priority: 'high', reporterId: 'u3', reporterName: 'botany_king', targetId: 'u12', targetName: 'toxic_player', reason: 'Repeated harassment in chat', description: 'User has been sending abusive messages to multiple players over the past week.', createdAt: '2026-05-27T08:30:00Z' },
  { id: 'r2', type: 'Cheating', status: 'pending', priority: 'critical', reporterId: 'u7', reporterName: 'terra_master', targetId: 'u15', targetName: 'hack_account', reason: 'Using automated gardening bots', description: 'Evidence of bot usage in competitive gardening events. Unrealistic scores.', createdAt: '2026-05-27T06:15:00Z' },
  { id: 'r3', type: 'Marketplace Fraud', status: 'pending', priority: 'high', reporterId: 'u9', reporterName: 'harvest_queen', targetId: 'u18', targetName: 'fake_seed_seller', reason: 'Sold fake rare seeds', description: 'Listed and sold seeds that do not match the description. Multiple buyers affected.', createdAt: '2026-05-26T22:45:00Z' },
  { id: 'r4', type: 'Spam', status: 'resolved', priority: 'low', reporterId: 'u1', reporterName: 'green_thumb', targetId: 'u20', targetName: 'spam_bot_01', reason: 'Spamming invite links', description: 'Posting referral links in global chat.', createdAt: '2026-05-26T14:20:00Z', resolvedAt: '2026-05-26T16:30:00Z', resolvedBy: 'admin_alex', action: 'warn' },
  { id: 'r5', type: 'Inappropriate Content', status: 'dismissed', priority: 'medium', reporterId: 'u5', reporterName: 'compost_guru', targetId: 'u22', targetName: 'edgy_gardener', reason: 'Garden name contains profanity', description: 'Garden named inappropriately.', createdAt: '2026-05-25T11:00:00Z', resolvedAt: '2026-05-25T13:15:00Z', resolvedBy: 'mod_nina', action: 'dismissed' },
  { id: 'r6', type: 'Harassment', status: 'resolved', priority: 'critical', reporterId: 'u11', reporterName: 'peaceful_grove', targetId: 'u4', targetName: 'seed_saver', reason: 'Threatening messages', description: 'Sent death threats over a trade dispute.', createdAt: '2026-05-24T19:30:00Z', resolvedAt: '2026-05-25T08:00:00Z', resolvedBy: 'admin_alex', action: 'suspended' },
  { id: 'r7', type: 'Marketplace Fraud', status: 'pending', priority: 'medium', reporterId: 'u14', reporterName: 'rare_plant_lover', targetId: 'u25', targetName: 'mystery_box_scam', reason: 'Selling mystery boxes with misleading odds', description: 'Claims 10% rare item rate but data suggests <1%.', createdAt: '2026-05-27T01:00:00Z' },
]

const autoModStats = [
  { name: 'Content Filtered', value: 1248, change: '+12%', trend: 'up' },
  { name: 'Spam Blocked', value: 892, change: '+5%', trend: 'up' },
  { name: 'Flagged for Review', value: 156, change: '-8%', trend: 'down' },
  { name: 'False Positives', value: 23, change: '-15%', trend: 'down' },
]

const recentActions = [
  { action: 'Suspended', target: 'seed_saver', moderator: 'admin_alex', reason: 'Threatening behavior', time: '2h ago' },
  { action: 'Warned', target: 'spam_bot_01', moderator: 'mod_nina', reason: 'Invite link spam', time: '5h ago' },
  { action: 'Dismissed', target: 'edgy_gardener', moderator: 'mod_nina', reason: 'No violation found', time: '1d ago' },
  { action: 'Banned', target: 'hack_account', moderator: 'admin_alex', reason: 'Automated bot usage', time: '1d ago' },
  { action: 'Content Removed', target: 'fake_seed_seller', moderator: 'auto_mod', reason: 'Fraudulent listing', time: '2d ago' },
]

export default function ModerationPage() {
  const [tab, setTab] = useState('pending')
  const [selectedReport, setSelectedReport] = useState<typeof mockReports[0] | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'warn' | 'suspend' | 'ban' | 'dismiss'>('warn')

  const filtered = mockReports.filter(r => r.status === tab)

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <TabsRoot value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Report Queue</h3>
              <TabsList>
                <TabsTrigger value="pending">
                  Pending
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-xs">
                    {mockReports.filter(r => r.status === 'pending').length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={tab}>
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
                onRowClick={r => setSelectedReport(r as typeof mockReports[0])}
                pageSize={8}
              />
            </TabsContent>
          </TabsRoot>
        </div>

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
