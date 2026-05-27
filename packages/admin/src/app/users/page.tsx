'use client'

import { useState } from 'react'
import { Download, Ban, Shield, UserCheck, Search, Filter, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import { downloadCSV } from '@/lib/utils'

const mockUsers = [
  { id: 'u1', username: 'green_thumb', email: 'sarah@example.com', displayName: 'Sarah Chen', level: 42, xp: 28450, role: 'premium', status: 'active', joinedAt: '2024-03-15', lastLoginAt: '2026-05-27', gardens: 3, invitesUsed: 5, reports: 0 },
  { id: 'u2', username: 'urban_farmer', email: 'mike@example.com', displayName: 'Mike Johnson', level: 28, xp: 15200, role: 'user', status: 'active', joinedAt: '2024-06-22', lastLoginAt: '2026-05-26', gardens: 1, invitesUsed: 2, reports: 1 },
  { id: 'u3', username: 'botany_king', email: 'alex@example.com', displayName: 'Alex Rivera', level: 56, xp: 42100, role: 'moderator', status: 'active', joinedAt: '2023-11-08', lastLoginAt: '2026-05-27', gardens: 5, invitesUsed: 12, reports: 0 },
  { id: 'u4', username: 'seed_saver', email: 'emma@example.com', displayName: 'Emma Wilson', level: 12, xp: 5400, role: 'user', status: 'suspended', joinedAt: '2025-01-14', lastLoginAt: '2026-05-20', gardens: 2, invitesUsed: 0, reports: 3 },
  { id: 'u5', username: 'compost_guru', email: 'james@example.com', displayName: 'James Park', level: 35, xp: 22100, role: 'premium', status: 'active', joinedAt: '2024-09-01', lastLoginAt: '2026-05-27', gardens: 4, invitesUsed: 8, reports: 0 },
  { id: 'u6', username: 'hack_the_planet', email: 'badactor@example.com', displayName: 'Known Bad', level: 3, xp: 450, role: 'user', status: 'banned', joinedAt: '2026-02-10', lastLoginAt: '2026-03-01', gardens: 0, invitesUsed: 0, reports: 12 },
  { id: 'u7', username: 'terra_master', email: 'lisa@example.com', displayName: 'Lisa Chang', level: 48, xp: 35600, role: 'premium', status: 'active', joinedAt: '2023-07-19', lastLoginAt: '2026-05-27', gardens: 6, invitesUsed: 15, reports: 0 },
  { id: 'u8', username: 'garden_newb', email: 'tom@example.com', displayName: 'Tom Harris', level: 5, xp: 1200, role: 'user', status: 'inactive', joinedAt: '2026-04-20', lastLoginAt: '2026-05-01', gardens: 1, invitesUsed: 1, reports: 0 },
  { id: 'u9', username: 'harvest_queen', email: 'nina@example.com', displayName: 'Nina Patel', level: 62, xp: 51200, role: 'moderator', status: 'active', joinedAt: '2023-03-05', lastLoginAt: '2026-05-27', gardens: 8, invitesUsed: 22, reports: 0 },
  { id: 'u10', username: 'weed_whisperer', email: 'chris@example.com', displayName: 'Chris Mueller', level: 18, xp: 8900, role: 'user', status: 'active', joinedAt: '2025-05-12', lastLoginAt: '2026-05-26', gardens: 2, invitesUsed: 3, reports: 2 },
]

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'suspend' | 'ban' | 'warn'>('suspend')
  const [actionReason, setActionReason] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = mockUsers.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'user', label: 'User' },
              { value: 'premium', label: 'Premium' },
              { value: 'moderator', label: 'Moderator' },
              { value: 'admin', label: 'Admin' },
            ]}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-36"
          />
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'banned', label: 'Banned' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-36"
          />
        </div>
        <Button variant="secondary" onClick={() => downloadCSV(mockUsers, 'users-export')}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="card">
        <DataTable
          columns={[
            { key: 'username', header: 'Username', sortable: true },
            { key: 'email', header: 'Email', sortable: true },
            { key: 'level', header: 'Level', sortable: true, width: '70px' },
            { key: 'xp', header: 'XP', sortable: true, width: '80px' },
            {
              key: 'role',
              header: 'Role',
              sortable: true,
              width: '100px',
              render: u => (
                <Badge variant={u.role === 'premium' ? 'success' : u.role === 'moderator' ? 'info' : u.role === 'admin' ? 'warning' : 'default'}>
                  {u.role as string}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              width: '100px',
              render: u => (
                <Badge variant={u.status as 'active' | 'suspended' | 'banned' | 'inactive'} dot>
                  {u.status as string}
                </Badge>
              ),
            },
            { key: 'joinedAt', header: 'Joined', sortable: true },
            { key: 'gardens', header: 'Gardens', sortable: true, width: '85px' },
            {
              key: 'actions',
              header: '',
              width: '40px',
              render: u => (
                <button
                  onClick={e => { e.stopPropagation(); setSelectedUser(u as typeof mockUsers[0]); setShowActionModal(true) }}
                  className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-200"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              ),
            },
          ]}
          data={filtered as unknown as Record<string, unknown>[]}
          keyExtractor={u => String(u.id)}
          searchable
          searchPlaceholder="Search users by name, email..."
          onRowClick={u => setSelectedUser(u as typeof mockUsers[0])}
          pageSize={10}
        />
      </div>

      {selectedUser && !showActionModal && (
        <Modal open={!!selectedUser} onOpenChange={o => !o && setSelectedUser(null)} title={selectedUser.displayName}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Username</p>
                <p className="text-sm text-slate-200">@{selectedUser.username}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-slate-200">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Level / XP</p>
                <p className="text-sm text-slate-200">Lv.{selectedUser.level} / {selectedUser.xp.toLocaleString()} XP</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Role</p>
                <Badge variant={selectedUser.role === 'premium' ? 'success' : selectedUser.role === 'moderator' ? 'info' : 'default'}>
                  {selectedUser.role}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <Badge variant={selectedUser.status as 'active' | 'suspended' | 'banned'} dot>
                  {selectedUser.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500">Gardens</p>
                <p className="text-sm text-slate-200">{selectedUser.gardens}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Joined</p>
                <p className="text-sm text-slate-200">{selectedUser.joinedAt}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Login</p>
                <p className="text-sm text-slate-200">{selectedUser.lastLoginAt}</p>
              </div>
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>Close</Button>
              <Button variant="danger" onClick={() => { setActionType('suspend'); setShowActionModal(true) }}>
                <Ban className="w-4 h-4" /> Suspend
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      <Modal
        open={showActionModal}
        onOpenChange={o => setShowActionModal(o)}
        title={actionType === 'suspend' ? 'Suspend User' : actionType === 'ban' ? 'Ban User' : 'Warn User'}
        description={selectedUser?.displayName}
      >
        <div className="space-y-4">
          <Select
            label="Action"
            options={[
              { value: 'warn', label: 'Send Warning' },
              { value: 'suspend', label: 'Suspend (7 days)' },
              { value: 'ban', label: 'Permanent Ban' },
            ]}
            value={actionType}
            onChange={e => setActionType(e.target.value as typeof actionType)}
          />
          <Input
            label="Reason"
            id="reason"
            value={actionReason}
            onChange={e => setActionReason(e.target.value)}
            placeholder="Provide a reason for this action..."
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => { setShowActionModal(false); setActionReason('') }}>Cancel</Button>
            <Button variant={actionType === 'ban' ? 'danger' : 'primary'}>
              {actionType === 'suspend' ? 'Suspend User' : actionType === 'ban' ? 'Ban User' : 'Send Warning'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
