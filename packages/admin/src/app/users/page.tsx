'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, Ban, Unlock, Trash2, KeyRound, Search, Filter, MoreHorizontal, Loader2, AlertCircle, CheckCircle, XCircle, ShieldAlert, MapPin, ExternalLink, Eye } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import { downloadCSV } from '@/lib/utils'
import { decodeGeohash } from '@/lib/geo'
import api, { type User } from '@/lib/api'

const MOCK_USERS: User[] = [
  { id: 'u1', username: 'green_thumb', email: 'sarah@example.com', displayName: 'Sarah Chen', level: 42, xp: 28450, role: 'premium', status: 'active', joinedAt: '2024-03-15', lastLoginAt: '2026-05-27', gardens: 3, invitesUsed: 5, reports: 0 },
  { id: 'u2', username: 'urban_farmer', email: 'mike@example.com', displayName: 'Mike Johnson', level: 28, xp: 15200, role: 'user', status: 'active', joinedAt: '2024-06-22', lastLoginAt: '2026-05-26', gardens: 1, invitesUsed: 2, reports: 1 },
  { id: 'u3', username: 'botany_king', email: 'alex@example.com', displayName: 'Alex Rivera', level: 56, xp: 42100, role: 'moderator', status: 'active', joinedAt: '2023-11-08', lastLoginAt: '2026-05-27', gardens: 5, invitesUsed: 12, reports: 0 },
  { id: 'u4', username: 'seed_saver', email: 'emma@example.com', displayName: 'Emma Wilson', level: 12, xp: 5400, role: 'user', status: 'suspended', joinedAt: '2025-01-14', lastLoginAt: '2026-05-20', gardens: 2, invitesUsed: 0, reports: 3 },
  { id: 'u5', username: 'compost_guru', email: 'james@example.com', displayName: 'James Park', level: 35, xp: 22100, role: 'premium', status: 'active', joinedAt: '2024-09-01', lastLoginAt: '2026-05-27', gardens: 4, invitesUsed: 8, reports: 0 },
  { id: 'u7', username: 'terra_master', email: 'lisa@example.com', displayName: 'Lisa Chang', level: 48, xp: 35600, role: 'premium', status: 'active', joinedAt: '2023-07-19', lastLoginAt: '2026-05-27', gardens: 6, invitesUsed: 15, reports: 0 },
  { id: 'u8', username: 'garden_newb', email: 'tom@example.com', displayName: 'Tom Harris', level: 5, xp: 1200, role: 'user', status: 'inactive', joinedAt: '2026-04-20', lastLoginAt: '2026-05-01', gardens: 1, invitesUsed: 1, reports: 0 },
  { id: 'u9', username: 'harvest_queen', email: 'nina@example.com', displayName: 'Nina Patel', level: 62, xp: 51200, role: 'moderator', status: 'active', joinedAt: '2023-03-05', lastLoginAt: '2026-05-27', gardens: 8, invitesUsed: 22, reports: 0 },
  { id: 'u10', username: 'weed_whisperer', email: 'chris@example.com', displayName: 'Chris Mueller', level: 18, xp: 8900, role: 'user', status: 'active', joinedAt: '2025-05-12', lastLoginAt: '2026-05-26', gardens: 2, invitesUsed: 3, reports: 2 },
]

interface BackendUser {
  id: string
  email: string
  username: string
  displayName: string | null
  role: string
  isBlocked?: boolean
  isVerified: boolean
  isOnboarded: boolean
  geohash: string | null
  region: string | null
  level: number
  trustScore: number
  greenCredits: number
  ecoPoints: number
  createdAt: string
  lastActiveAt: string | null
  _count: { crops: number; listings: number; notifications: number }
}

function mapBackendUser(u: BackendUser): User {
  const roleMap: Record<string, User['role']> = {
    USER: 'user',
    MODERATOR: 'moderator',
    REGIONAL_MODERATOR: 'moderator',
    ADMIN: 'admin',
    SUPER_ADMIN: 'admin',
  }
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    displayName: u.displayName || u.username,
    level: u.level,
    xp: Math.round(u.ecoPoints) || u.level * 1000,
    role: roleMap[u.role] || 'user',
    status: u.isBlocked ? 'banned' : 'active',
    joinedAt: u.createdAt,
    lastLoginAt: u.lastActiveAt || u.createdAt,
    gardens: u._count?.crops ?? 0,
    invitesUsed: 0,
    reports: 0,
  }
}

function LocationView({ userId, mapsKey: key }: { userId: string; mapsKey: string }) {
  const [loc, setLoc] = useState<{ latitude: number | null; longitude: number | null; geohash: string | null; region: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/users/${userId}/location`)
      .then(r => setLoc(r.data))
      .catch(() => setLoc(null))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 text-admin-400 animate-spin" />
      </div>
    )
  }

  if (!loc || !loc.geohash || loc.latitude == null || loc.longitude == null) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 gap-3">
        <MapPin className="w-10 h-10 text-slate-600" />
        <p className="text-sm">No location data available for this user.</p>
        <p className="text-xs text-slate-600">User has not set a geohash location.</p>
      </div>
    )
  }

  const src = key
    ? `https://www.google.com/maps/embed/v1/view?key=${key}&center=${loc.latitude},${loc.longitude}&zoom=12`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.1},${loc.latitude - 0.1},${loc.longitude + 0.1},${loc.latitude + 0.1}&layer=mapnik&marker=${loc.latitude},${loc.longitude}`

  const mapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}&z=12`

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <MapPin className="w-4 h-4 text-admin-400" />
        <span>Approximate location based on geohash</span>
        {loc.region && (
          <Badge variant="info" className="ml-auto">{loc.region}</Badge>
        )}
      </div>

      {key && (
        <p className="text-xs text-slate-500">
          Geohash: <code className="text-slate-400 bg-slate-800 px-1 rounded">{loc.geohash}</code>
          <span className="ml-3">
            {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
          </span>
        </p>
      )}

      <div className="relative w-full overflow-hidden rounded-lg border border-slate-700/50" style={{ height: 380 }}>
        <iframe
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="User location"
        />
      </div>

      <div className="flex justify-end">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-admin-400 hover:text-admin-300 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Google Maps
        </a>
      </div>
    </div>
  )
}

function roleToApi(value: string): string | undefined {
  if (value === 'all') return undefined
  const map: Record<string, string | undefined> = {
    user: 'USER',
    premium: undefined,
    moderator: 'MODERATOR',
    admin: 'ADMIN',
  }
  return map[value]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [backendUsers, setBackendUsers] = useState<BackendUser[]>([])
  const [selectedGeo, setSelectedGeo] = useState<{ geohash: string | null; region: string | null } | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailTab, setDetailTab] = useState('details')
  const [mapsKey, setMapsKey] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [blockReason, setBlockReason] = useState('')
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetPwModal, setShowResetPwModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showUnblockModal, setShowUnblockModal] = useState(false)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setIsUsingFallback(false)

    try {
      const roleParam = roleToApi(roleFilter)
      const params: Record<string, string | number> = { limit: 100 }
      if (roleParam) params.role = roleParam

      const res = await api.get('/users', { params })
      const body = res.data as { data: BackendUser[]; total: number }
      const mapped: User[] = (body.data || []).map(mapBackendUser)
      setUsers(mapped)
      setBackendUsers(body.data || [])
    } catch (err) {
      console.error('Failed to fetch users from API, using mock data:', err)
      setError('Could not load from server. Showing cached data.')
      setIsUsingFallback(true)
      setUsers(MOCK_USERS)
    } finally {
      setIsLoading(false)
    }
  }, [roleFilter])

  useEffect(() => {
    fetchUsers()
    api.get('/config/maps-key').then(r => setMapsKey(r.data?.key || '')).catch(() => {})
  }, [fetchUsers])

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  const filtered = users.filter(u => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    return true
  })

  const handleExport = () => {
    downloadCSV(filtered as unknown as Record<string, unknown>[], 'users-export')
  }

  const doBlock = async () => {
    if (!selectedUser || !blockReason.trim()) return
    setActionLoading(true)
    try {
      await api.put(`/admin/users/${selectedUser.id}/block`, { reason: blockReason })
      setSuccessMsg(`User ${selectedUser.displayName} blocked successfully`)
      setShowBlockModal(false)
      setBlockReason('')
      setShowDetailModal(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to block user')
    } finally {
      setActionLoading(false)
    }
  }

  const doUnblock = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      await api.put(`/admin/users/${selectedUser.id}/unblock`)
      setSuccessMsg(`User ${selectedUser.displayName} unblocked successfully`)
      setShowUnblockModal(false)
      setShowDetailModal(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unblock user')
    } finally {
      setActionLoading(false)
    }
  }

  const doDelete = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      await api.delete(`/admin/users/${selectedUser.id}`)
      setSuccessMsg(`User ${selectedUser.displayName} deleted successfully`)
      setShowDeleteModal(false)
      setShowDetailModal(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setActionLoading(false)
    }
  }

  const doResetPassword = async () => {
    if (!selectedUser || !newPassword.trim()) return
    setActionLoading(true)
    try {
      await api.post(`/admin/users/${selectedUser.id}/reset-password`, { newPassword })
      setSuccessMsg(`Password reset for ${selectedUser.displayName}`)
      setShowResetPwModal(false)
      setNewPassword('')
      setShowDetailModal(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">{successMsg}</p>
          <Button variant="ghost" size="sm" onClick={() => setSuccessMsg(null)}>
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>
            {isUsingFallback && (
              <p className="text-xs text-amber-400/70 mt-1">Data shown may not reflect the current state.</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { fetchUsers(); setError(null) }}>
            Retry
          </Button>
        </div>
      )}

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
        <Button variant="secondary" onClick={handleExport}>
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
              render: u => {
                const rowUser = u as unknown as User
                return (
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedUser(rowUser); setSelectedGeo({ geohash: null, region: null }); setDetailTab('details'); setShowDetailModal(true) }}
                    className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-200"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                )
              },
            },
          ]}
          data={filtered as unknown as Record<string, unknown>[]}
          keyExtractor={u => String(u.id)}
          searchable
          searchPlaceholder="Search users by name, email..."
          onRowClick={u => {
            const user = u as unknown as User
            setSelectedUser(user)
            setSelectedGeo({ geohash: null, region: null })
            setDetailTab('details')
            setShowDetailModal(true)
          }}
          pageSize={10}
          loading={isLoading}
        />
      </div>

      {/* Detail Modal */}
      {selectedUser && showDetailModal && (
        <Modal open={showDetailModal} onOpenChange={o => { if (!o) { setShowDetailModal(false); setSelectedUser(null); setDetailTab('details') } }} title={selectedUser.displayName}>
          <TabsRoot value={detailTab} onValueChange={setDetailTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
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
                    <Badge variant={selectedUser.status as 'active' | 'suspended' | 'banned' | 'inactive'} dot>
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

                <div className="border-t border-slate-800 pt-4 space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowBlockModal(true)}
                      disabled={selectedUser.status === 'banned'}
                    >
                      <Ban className="w-4 h-4" /> {selectedUser.status === 'banned' ? 'Blocked' : 'Block User'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowUnblockModal(true)}
                      disabled={selectedUser.status !== 'banned'}
                    >
                      <Unlock className="w-4 h-4" /> Unblock
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowResetPwModal(true)}
                    >
                      <KeyRound className="w-4 h-4" /> Reset Password
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <Trash2 className="w-4 h-4" /> Delete User
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowDetailModal(false)
                        window.location.href = `/garden?userId=${selectedUser.id}`
                      }}
                    >
                      <Eye className="w-4 h-4" /> View Garden
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location">
              <LocationView userId={selectedUser.id} mapsKey={mapsKey} />
            </TabsContent>
          </TabsRoot>
        </Modal>
      )}

      {/* Block Modal */}
      <Modal
        open={showBlockModal}
        onOpenChange={o => { setShowBlockModal(o); if (!o) setBlockReason('') }}
        title="Block User"
        description={selectedUser?.displayName}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">Blocking this user will prevent them from logging in. They will see a message to contact support.</p>
          </div>
          <Input
            label="Block Reason"
            id="blockReason"
            value={blockReason}
            onChange={e => setBlockReason(e.target.value)}
            placeholder="Enter reason for blocking this user..."
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => { setShowBlockModal(false); setBlockReason('') }}>Cancel</Button>
            <Button variant="danger" onClick={doBlock} loading={actionLoading} disabled={!blockReason.trim()}>
              <Ban className="w-4 h-4" /> Block User
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Unblock Modal */}
      <Modal
        open={showUnblockModal}
        onOpenChange={o => setShowUnblockModal(o)}
        title="Unblock User"
        description={selectedUser?.displayName}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
            <Unlock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-300">Unblocking will allow this user to log in again. They will receive a notification.</p>
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowUnblockModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={doUnblock} loading={actionLoading}>
              <Unlock className="w-4 h-4" /> Unblock User
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={showResetPwModal}
        onOpenChange={o => { setShowResetPwModal(o); if (!o) setNewPassword('') }}
        title="Reset Password"
        description={selectedUser?.displayName}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-400/10 border border-amber-400/20">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300">This will immediately change the user&apos;s password. They will need to use the new password to log in.</p>
          </div>
          <Input
            label="New Password"
            id="newPassword"
            type="text"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 8 characters)"
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => { setShowResetPwModal(false); setNewPassword('') }}>Cancel</Button>
            <Button variant="primary" onClick={doResetPassword} loading={actionLoading} disabled={!newPassword.trim() || newPassword.length < 8}>
              <KeyRound className="w-4 h-4" /> Reset Password
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={showDeleteModal}
        onOpenChange={o => setShowDeleteModal(o)}
        title="Delete User"
        description={selectedUser?.displayName}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              This will soft-delete the user account. The user will no longer be able to log in. This action can be reversed by an admin.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p className="text-sm text-slate-300">
              Are you sure you want to delete <strong className="text-slate-100">{selectedUser?.displayName}</strong> (@{selectedUser?.username})?
            </p>
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={doDelete} loading={actionLoading}>
              <Trash2 className="w-4 h-4" /> Delete User
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}

