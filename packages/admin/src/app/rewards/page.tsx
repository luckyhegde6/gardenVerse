'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Coins,
  Gem,
  Search,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { PaginatedResponse } from '@/lib/api'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface RewardsUser {
  id: string
  username: string
  displayName: string | null
  email: string
  level: number
  experience: number
  greenCredits: number
  ecoPoints: number
  _count: { tokenTransactions: number }
}

interface TokenTransactionRecord {
  id: string
  type: 'GREEN_CREDITS' | 'ECO_POINTS' | 'REPUTATION_TOKENS'
  amount: number
  balanceBefore: number
  balanceAfter: number
  action: string
  description: string | null
  userId: string
  user: { id: string; username: string; displayName: string | null; email: string }
  createdAt: string
}

interface SimpleUser {
  id: string
  username: string
  displayName: string | null
  email: string
}

interface AdjustmentFormState {
  userId: string
  type: 'GREEN_CREDITS' | 'ECO_POINTS'
  amount: string
  action: string
  description: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'GREEN_CREDITS', label: 'Green Credits' },
  { value: 'ECO_POINTS', label: 'Eco Points' },
  { value: 'REPUTATION_TOKENS', label: 'Reputation Tokens' },
]

const TOKEN_TYPE_OPTIONS = [
  { value: 'GREEN_CREDITS', label: 'Green Credits' },
  { value: 'ECO_POINTS', label: 'Eco Points' },
]

const INITIAL_FORM: AdjustmentFormState = {
  userId: '',
  type: 'GREEN_CREDITS',
  amount: '',
  action: '',
  description: '',
}

/* ------------------------------------------------------------------ */
/*  Rewards Page                                                      */
/* ------------------------------------------------------------------ */

export default function RewardsPage() {
  /* ---- Tab State ---- */
  const [activeTab, setActiveTab] = useState('overview')

  /* ---- Overview State ---- */
  const [users, setUsers] = useState<RewardsUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  /* ---- Transactions State ---- */
  const [transactions, setTransactions] = useState<TokenTransactionRecord[]>([])
  const [transactionsTotal, setTransactionsTotal] = useState(0)
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState<string | null>(null)
  const [txUserId, setTxUserId] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState('')

  /* ---- User List for Dropdowns ---- */
  const [userList, setUserList] = useState<SimpleUser[]>([])
  const [userListLoading, setUserListLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  /* ---- Adjust Form State ---- */
  const [selectedUserForAdjust, setSelectedUserForAdjust] = useState<SimpleUser | null>(null)
  const [adjustForm, setAdjustForm] = useState<AdjustmentFormState>(INITIAL_FORM)
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ============================================================== */
  /*  Data Fetching                                                  */
  /* ============================================================== */

  const fetchUsers = useCallback(async (search?: string) => {
    setOverviewLoading(true)
    setOverviewError(null)
    try {
      const res = await api.get('/rewards', {
        params: { type: 'users', search: search || undefined, limit: 50 },
      })
      const body = res.data as PaginatedResponse<RewardsUser>
      setUsers(body.data ?? [])
      setUsersTotal(body.total ?? 0)
    } catch {
      setOverviewError('Could not load rewards data.')
      setUsers([])
      setUsersTotal(0)
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  const fetchTransactions = useCallback(async (userId?: string, tokenType?: string) => {
    setTxLoading(true)
    setTxError(null)
    try {
      const params: Record<string, string> = { type: 'transactions', limit: '50' }
      if (userId) params.userId = userId
      if (tokenType) params.tokenType = tokenType

      const res = await api.get('/rewards', { params })
      const body = res.data as PaginatedResponse<TokenTransactionRecord>
      setTransactions(body.data ?? [])
      setTransactionsTotal(body.total ?? 0)
    } catch {
      setTxError('Could not load transaction history.')
      setTransactions([])
      setTransactionsTotal(0)
    } finally {
      setTxLoading(false)
    }
  }, [])

  const fetchUserList = useCallback(async (search?: string) => {
    setUserListLoading(true)
    try {
      const res = await api.get('/users', {
        params: { query: search || '', limit: 50 },
      })
      const body = res.data as PaginatedResponse<{ id: string; username: string; displayName: string | null; email: string }>
      setUserList(body.data ?? [])
    } catch {
      setUserList([])
    } finally {
      setUserListLoading(false)
    }
  }, [])

  /* ============================================================== */
  /*  Side Effects                                                   */
  /* ============================================================== */

  useEffect(() => {
    fetchUsers()
    fetchUserList()
  }, [fetchUsers, fetchUserList])

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions(txUserId || undefined, txTypeFilter || undefined)
    }
  }, [activeTab, txUserId, txTypeFilter, fetchTransactions])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* Auto-dismiss success message after 4s */
  useEffect(() => {
    if (adjustSuccess) {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = setTimeout(() => setAdjustSuccess(null), 4000)
    }
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
  }, [adjustSuccess])

  /* ============================================================== */
  /*  Computed Values                                                */
  /* ============================================================== */

  const totalGreenCredits = users.reduce((sum, u) => sum + u.greenCredits, 0)
  const totalEcoPoints = users.reduce((sum, u) => sum + u.ecoPoints, 0)

  const userSelectOptions = userList.map(u => ({
    value: u.id,
    label: `${u.username}${u.displayName ? ` (${u.displayName})` : ''} — ${u.email}`,
  }))

  const selectedUserName = selectedUserForAdjust
    ? `${selectedUserForAdjust.username}${selectedUserForAdjust.displayName ? ` (${selectedUserForAdjust.displayName})` : ''}`
    : ''

  /* ============================================================== */
  /*  Handlers                                                      */
  /* ============================================================== */

  const handleSearch = () => {
    fetchUsers(searchQuery || undefined)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleRowClick = (item: Record<string, unknown>) => {
    const user = item as unknown as RewardsUser
    setSelectedUserForAdjust({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
    })
    setAdjustForm(prev => ({
      ...prev,
      userId: user.id,
    }))
    setActiveTab('adjust')
  }

  const handleTxUserChange = (value: string) => {
    setTxUserId(value)
  }

  const handleTxTypeChange = (value: string) => {
    setTxTypeFilter(value)
  }

  const handleSelectUserForAdjust = (user: SimpleUser) => {
    setSelectedUserForAdjust(user)
    setAdjustForm(prev => ({ ...prev, userId: user.id }))
    setShowUserDropdown(false)
  }

  const handleAdjustFieldChange = (field: keyof AdjustmentFormState, value: string) => {
    setAdjustForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAdjustSubmit = useCallback(async () => {
    setAdjustError(null)
    setAdjustSuccess(null)

    if (!adjustForm.userId) {
      setAdjustError('Please select a user.')
      return
    }
    const amountNum = parseFloat(adjustForm.amount)
    if (isNaN(amountNum) || amountNum === 0) {
      setAdjustError('Amount must be a non-zero number.')
      return
    }
    if (!adjustForm.action.trim()) {
      setAdjustError('Action is required.')
      return
    }

    setAdjustSubmitting(true)
    try {
      await api.post('/rewards', {
        userId: adjustForm.userId,
        type: adjustForm.type,
        amount: amountNum,
        action: adjustForm.action.trim(),
        description: adjustForm.description.trim() || undefined,
      })

      setAdjustSuccess(`Successfully ${amountNum > 0 ? 'credited' : 'debited'} ${Math.abs(amountNum)} ${adjustForm.type === 'GREEN_CREDITS' ? 'Green Credits' : 'Eco Points'}.`)
      setAdjustForm(prev => ({ ...prev, amount: '', action: '', description: '' }))

      // Refresh overview data
      fetchUsers(searchQuery || undefined)
      // Refresh transaction data if on that tab
      if (activeTab === 'transactions') {
        fetchTransactions(txUserId || undefined, txTypeFilter || undefined)
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Server error: ${(err as { response: { data?: { error?: string }; status: number } }).response?.data?.error ?? (err as { response: { status: number } }).response?.status ?? 'Unknown'}`
          : 'Failed to adjust tokens.'
      setAdjustError(message)
    } finally {
      setAdjustSubmitting(false)
    }
  }, [adjustForm, searchQuery, activeTab, txUserId, txTypeFilter, fetchUsers, fetchTransactions])

  /* ============================================================== */
  /*  Render                                                        */
  /* ============================================================== */

  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400/10">
            <Coins className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Rewards &amp; Tokens</h1>
            <p className="text-sm text-slate-500">Manage user token balances and view transaction history</p>
          </div>
        </div>
        <Badge variant="success" dot>Live</Badge>
      </div>

      {/* ============ SUCCESS BANNER ============ */}
      {adjustSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">{adjustSuccess}</p>
          <Button variant="ghost" size="sm" onClick={() => setAdjustSuccess(null)}>Dismiss</Button>
        </div>
      )}

      {/* ============ TABS ============ */}
      <TabsRoot value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="adjust">Adjust Tokens</TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/*  TAB 1: OVERVIEW                                               */}
        {/* ============================================================== */}
        <TabsContent value="overview">
          {/* Stat badges */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Badge variant="info">
              {usersTotal} Users
            </Badge>
            <Badge variant="success">
              <Coins className="w-3 h-3 mr-1" />
              {totalGreenCredits.toLocaleString()} Green Credits
            </Badge>
            <Badge variant="warning">
              <Gem className="w-3 h-3 mr-1" />
              {totalEcoPoints.toLocaleString()} Eco Points
            </Badge>
          </div>

          {/* Error banner */}
          {overviewError && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300 flex-1">{overviewError}</p>
              <Button variant="ghost" size="sm" onClick={() => fetchUsers(searchQuery || undefined)}>
                Retry
              </Button>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by username, email..."
                className="input-field pl-10"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleSearch}>
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>

          {/* DataTable */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">User Token Balances</h3>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <DataTable
              columns={[
                { key: 'username', header: 'Username', sortable: true },
                {
                  key: 'displayName',
                  header: 'Display Name',
                  render: (r) => {
                    const name = r.displayName as string | null
                    return <span className="text-slate-400">{name || '—'}</span>
                  },
                },
                {
                  key: 'level',
                  header: 'Level',
                  sortable: true,
                  width: '80px',
                  render: (r) => (
                    <span className="font-mono text-slate-200">{r.level as number}</span>
                  ),
                },
                {
                  key: 'greenCredits',
                  header: 'Green Credits',
                  sortable: true,
                  width: '140px',
                  render: (r) => {
                    const val = r.greenCredits as number
                    return (
                      <span className={val >= 0 ? 'text-emerald-400 font-mono' : 'text-red-400 font-mono'}>
                        {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    )
                  },
                },
                {
                  key: 'ecoPoints',
                  header: 'Eco Points',
                  sortable: true,
                  width: '120px',
                  render: (r) => {
                    const val = r.ecoPoints as number
                    return (
                      <span className={val >= 0 ? 'text-cyan-400 font-mono' : 'text-red-400 font-mono'}>
                        {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    )
                  },
                },
                {
                  key: '_count',
                  header: 'Transactions',
                  width: '130px',
                  render: (r) => {
                    const cnt = (r._count as { tokenTransactions: number }).tokenTransactions
                    return <span className="text-slate-400 font-mono">{cnt}</span>
                  },
                },
              ]}
              data={users as unknown as Record<string, unknown>[]}
              keyExtractor={(r) => r.id as string}
              loading={overviewLoading}
              emptyMessage={searchQuery ? 'No users match your search.' : 'No users found.'}
              onRowClick={handleRowClick}
            />
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/*  TAB 2: TRANSACTIONS                                           */}
        {/* ============================================================== */}
        <TabsContent value="transactions">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* User select */}
            <div className="w-[300px]">
              <Select
                options={[
                  { value: '', label: 'All Users' },
                  ...userSelectOptions,
                ]}
                value={txUserId}
                onChange={e => handleTxUserChange(e.target.value)}
                placeholder="Filter by user"
              />
            </div>
            {/* Type filter */}
            <div className="w-[180px]">
              <Select
                options={TYPE_FILTER_OPTIONS}
                value={txTypeFilter}
                onChange={e => handleTxTypeChange(e.target.value)}
                placeholder="Token type"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setTxUserId(''); setTxTypeFilter('') }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Error */}
          {txError && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300 flex-1">{txError}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchTransactions(txUserId || undefined, txTypeFilter || undefined)}
              >
                Retry
              </Button>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Token Transaction History</h3>
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
            </div>
            <DataTable
              columns={[
                {
                  key: 'createdAt',
                  header: 'Timestamp',
                  sortable: true,
                  width: '160px',
                  render: (r) => (
                    <span className="text-slate-400 text-xs">
                      {formatDateTime(r.createdAt as string)}
                    </span>
                  ),
                },
                {
                  key: 'user',
                  header: 'User',
                  width: '150px',
                  render: (r) => {
                    const u = r.user as { username: string; displayName: string | null }
                    return (
                      <span className="text-slate-200 text-sm">
                        {u.displayName || u.username}
                      </span>
                    )
                  },
                },
                {
                  key: 'type',
                  header: 'Type',
                  width: '120px',
                  sortable: true,
                  render: (r) => {
                    const t = r.type as string
                    return t === 'GREEN_CREDITS'
                      ? <Badge variant="success">Green Credits</Badge>
                      : t === 'ECO_POINTS'
                        ? <Badge variant="warning">Eco Points</Badge>
                        : <Badge variant="info">Reputation</Badge>
                  },
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  width: '100px',
                  sortable: true,
                  render: (r) => {
                    const amt = r.amount as number
                    return (
                      <span className={cn(
                        'font-mono font-medium',
                        amt > 0 ? 'text-emerald-400' : amt < 0 ? 'text-red-400' : 'text-slate-400'
                      )}>
                        {amt > 0 ? '+' : ''}{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    )
                  },
                },
                {
                  key: 'action',
                  header: 'Action',
                  width: '140px',
                  render: (r) => (
                    <Badge variant="default">
                      <span className="text-xs font-mono uppercase">{r.action as string}</span>
                    </Badge>
                  ),
                },
                {
                  key: 'balanceBefore',
                  header: 'Before → After',
                  width: '150px',
                  render: (r) => {
                    const before = r.balanceBefore as number
                    const after = r.balanceAfter as number
                    return (
                      <span className="text-slate-400 font-mono text-xs">
                        {before.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-slate-600 mx-1">→</span>
                        <span className={after >= before ? 'text-emerald-400' : 'text-red-400'}>
                          {after.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </span>
                    )
                  },
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (r) => {
                    const desc = r.description as string | null
                    return <span className="text-slate-500 text-xs">{desc || '—'}</span>
                  },
                },
              ]}
              data={transactions as unknown as Record<string, unknown>[]}
              keyExtractor={(r) => r.id as string}
              loading={txLoading}
              emptyMessage="No transactions found."
            />
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/*  TAB 3: ADJUST TOKENS                                         */}
        {/* ============================================================== */}
        <TabsContent value="adjust">
          <div className="card max-w-2xl">
            <div className="card-header">
              <h3 className="card-title">Adjust User Tokens</h3>
              {adjustForm.amount && parseFloat(adjustForm.amount) > 0
                ? <Plus className="w-4 h-4 text-emerald-400" />
                : <Minus className="w-4 h-4 text-red-400" />
              }
            </div>

            {/* Error */}
            {adjustError && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-400/10 border border-red-400/20 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300 flex-1">{adjustError}</p>
              </div>
            )}

            <div className="space-y-5">
              {/* ---- User Selector ---- */}
              <div className="relative" ref={userDropdownRef}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  User <span className="text-red-400">*</span>
                </label>
                <div
                  className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 bg-slate-800/50 cursor-pointer hover:border-slate-600 transition-colors"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  {selectedUserForAdjust
                    ? selectedUserName
                    : <span className="text-slate-500">Select a user...</span>
                  }
                </div>

                {showUserDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-slate-800">
                      <input
                        type="text"
                        value={userSearch}
                        onChange={e => {
                          setUserSearch(e.target.value)
                          fetchUserList(e.target.value)
                        }}
                        placeholder="Search users..."
                        className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-admin-500/50"
                      />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {userListLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                        </div>
                      ) : userList.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-500">No users found</p>
                      ) : (
                        userList.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                            onClick={() => handleSelectUserForAdjust(u)}
                          >
                            <span className="font-medium">{u.username}</span>
                            {u.displayName && (
                              <span className="text-slate-500 ml-1">({u.displayName})</span>
                            )}
                            <span className="text-slate-600 ml-2 text-xs">{u.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ---- Token Type ---- */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Token Type <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-4">
                  {TOKEN_TYPE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors',
                        adjustForm.type === opt.value
                          ? 'border-admin-500/50 bg-admin-500/10 text-slate-100'
                          : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      <input
                        type="radio"
                        name="tokenType"
                        value={opt.value}
                        checked={adjustForm.type === opt.value}
                        onChange={e => handleAdjustFieldChange('type', e.target.value as 'GREEN_CREDITS' | 'ECO_POINTS')}
                        className="sr-only"
                      />
                      {opt.value === 'GREEN_CREDITS'
                        ? <Coins className="w-4 h-4 text-emerald-400" />
                        : <Gem className="w-4 h-4 text-cyan-400" />
                      }
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ---- Amount ---- */}
              <Input
                id="adjust-amount"
                label={`Amount (positive = credit, negative = debit)`}
                type="number"
                step="0.01"
                placeholder="e.g. 100 or -50"
                value={adjustForm.amount}
                onChange={e => handleAdjustFieldChange('amount', e.target.value)}
              />

              {/* ---- Action ---- */}
              <Input
                id="adjust-action"
                label="Action <span class='text-red-400'>*</span>"
                placeholder="e.g. support_adjustment, event_reward, manual_credit"
                value={adjustForm.action}
                onChange={e => handleAdjustFieldChange('action', e.target.value)}
              />

              {/* ---- Description ---- */}
              <div className="space-y-1.5">
                <label htmlFor="adjust-desc" className="block text-sm font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  id="adjust-desc"
                  rows={3}
                  placeholder="Optional note about this adjustment..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500 transition-colors resize-none"
                  value={adjustForm.description}
                  onChange={e => handleAdjustFieldChange('description', e.target.value)}
                />
              </div>

              {/* ---- Submit ---- */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAdjustForm(INITIAL_FORM)
                    setSelectedUserForAdjust(null)
                    setAdjustError(null)
                    setAdjustSuccess(null)
                  }}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAdjustSubmit}
                  loading={adjustSubmitting}
                  disabled={adjustSubmitting}
                >
                  {adjustSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      {adjustForm.amount && parseFloat(adjustForm.amount) > 0
                        ? <><Plus className="w-4 h-4" /> Credit Tokens</>
                        : <><Minus className="w-4 h-4" /> Debit Tokens</>
                      }
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </TabsRoot>
    </div>
  )
}
