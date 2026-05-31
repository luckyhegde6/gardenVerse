'use client'

import { useState, useEffect, useCallback } from 'react'
import { Store, Flag, Scale, Tags, Receipt, AlertTriangle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import { StatCard } from '@/components/StatCard'
import api from '@/lib/api'

// ── Types ──────────────────────────────────────────────────

interface MarketplaceListing {
  id: string
  title: string
  sellerName: string
  price: number
  category: string
  status: 'active' | 'flagged' | 'sold' | 'removed'
  createdAt: string
  reports: number
  views: number
}

interface Transaction {
  id: string
  type: string
  item: string
  seller: string
  buyer: string
  amount: number
  fee: number
  date: string
}

interface MarketStats {
  totalListings: number
  flaggedItems: number
  openDisputes: number
  volume7d: number
}

// ── Page Component ────────────────────────────────────────

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalListings: 0,
    flaggedItems: 0,
    openDisputes: 0,
    volume7d: 0,
  })
  const [tab, setTab] = useState('all')
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [listingsRes, txRes, dashRes] = await Promise.all([
        api.get('/marketplace/listings', { params: { limit: 50 } }),
        api.get('/admin/transactions', { params: { limit: 20 } }),
        api.get('/admin/dashboard'),
      ])

      // Parse listings
      const listingsBody = listingsRes.data as Record<string, unknown>
      const rawListings = (listingsBody.data as unknown[]) ||
        (listingsBody.listings as unknown[]) ||
        (Array.isArray(listingsBody) ? listingsBody : [])

      if (Array.isArray(rawListings) && rawListings.length > 0) {
        setListings(rawListings.map(l => {
          const entry = l as Record<string, unknown>
          return {
            id: String(entry.id ?? ''),
            title: String(entry.title ?? 'Unknown Listing'),
            sellerName: String(entry.sellerName ?? entry.seller_name ?? 'unknown'),
            price: typeof entry.price === 'number' ? entry.price : Number(entry.price ?? 0),
            category: String(entry.category ?? 'General'),
            status: String(entry.status ?? 'active') as MarketplaceListing['status'],
            createdAt: String(entry.createdAt ?? entry.created_at ?? new Date().toISOString().slice(0, 10)),
            reports: typeof entry.reports === 'number' ? entry.reports : Number(entry.reports ?? 0),
            views: typeof entry.views === 'number' ? entry.views : Number(entry.views ?? 0),
          }
        }))
      }

      // Parse transactions
      const txBody = txRes.data as Record<string, unknown>
      const rawTxs = (txBody.data as unknown[]) ||
        (txBody.transactions as unknown[]) ||
        (Array.isArray(txBody) ? txBody : [])

      if (Array.isArray(rawTxs) && rawTxs.length > 0) {
        setTransactions(rawTxs.map(t => {
          const entry = t as Record<string, unknown>
          return {
            id: String(entry.id ?? ''),
            type: String(entry.type ?? 'Listing'),
            item: String(entry.item ?? 'Unknown'),
            seller: String(entry.seller ?? entry.sellerName ?? 'unknown'),
            buyer: String(entry.buyer ?? entry.buyerName ?? 'unknown'),
            amount: typeof entry.amount === 'number' ? entry.amount : Number(entry.amount ?? 0),
            fee: typeof entry.fee === 'number' ? entry.fee : Number(entry.fee ?? 0),
            date: String(entry.date ?? entry.createdAt ?? entry.created_at ?? new Date().toISOString()),
          }
        }))
      }

      // Parse dashboard stats
      if (dashRes.data) {
        const d = dashRes.data as Record<string, unknown>
        setMarketStats({
          totalListings: typeof d.totalListings === 'number' ? d.totalListings : 0,
          flaggedItems: typeof d.flaggedItems === 'number' ? d.flaggedItems : typeof d.pendingReports === 'number' ? d.pendingReports : 0,
          openDisputes: typeof d.openDisputes === 'number' ? d.openDisputes : 0,
          volume7d: typeof d.marketplaceVolume === 'number' ? d.marketplaceVolume : typeof d.totalRevenue === 'number' ? d.totalRevenue : 0,
        })
      }
    } catch {
      setError('Could not load marketplace data from server.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = tab === 'all' ? listings : listings.filter(l => l.status === tab)
  const flaggedCount = listings.filter(l => l.status === 'flagged').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading marketplace...</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Listings" value={marketStats.totalListings} change={5.2} trend="up" icon={<Store className="w-6 h-6" />} changeLabel="this week" />
        <StatCard title="Flagged Items" value={marketStats.flaggedItems} change={-12} trend="down" icon={<Flag className="w-6 h-6" />} changeLabel="vs last week" />
        <StatCard title="Open Disputes" value={marketStats.openDisputes} change={2} trend="up" icon={<Scale className="w-6 h-6" />} changeLabel="new today" />
        <StatCard title="Volume (7d)" value={marketStats.volume7d} change={18.3} trend="up" icon={<Receipt className="w-6 h-6" />} changeLabel="vs last week" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 card">
          <TabsRoot value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">All Listings</h3>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="flagged">
                  Flagged
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-400/20 text-red-400 text-xs">
                    {flaggedCount}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="sold">Sold</TabsTrigger>
                <TabsTrigger value="removed">Removed</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={tab}>
              <DataTable
                columns={[
                  { key: 'title', header: 'Title', sortable: true },
                  { key: 'sellerName', header: 'Seller', sortable: true },
                  { key: 'price', header: 'Price', sortable: true, render: r => `${(r.price as number).toLocaleString()} ¤` },
                  { key: 'category', header: 'Category', sortable: true },
                  {
                    key: 'status',
                    header: 'Status',
                    sortable: true,
                    width: '100px',
                    render: r => (
                      <Badge variant={r.status === 'active' ? 'success' : r.status === 'flagged' ? 'error' : r.status === 'sold' ? 'info' : 'default'}>
                        {r.status as string}
                      </Badge>
                    ),
                  },
                  { key: 'reports', header: 'Reports', sortable: true, width: '80px' },
                  { key: 'views', header: 'Views', sortable: true, width: '80px' },
                ]}
                data={filtered as unknown as Record<string, unknown>[]}
                keyExtractor={item => String(item.id)}
                searchable
                searchPlaceholder="Search listings..."
                onRowClick={r => setSelectedListing(r as unknown as MarketplaceListing)}
                pageSize={8}
              />
            </TabsContent>
          </TabsRoot>
        </div>

        <div className="card">
          <h3 className="card-title mb-4">
            <div className="flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Categories
            </div>
          </h3>
          {listings.length > 0 ? (
            <div className="space-y-3">
              {Array.from(new Set(listings.map(l => l.category))).map(cat => {
                const count = listings.filter(l => l.category === cat).length
                const active = listings.filter(l => l.category === cat && l.status === 'active').length
                return (
                  <div key={cat} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm text-slate-300">{cat}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-200">{count.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{active} active</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 p-2">No category data available.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Transactions</h3>
          <Badge variant="info">Live</Badge>
        </div>
        <DataTable
          columns={[
            { key: 'type', header: 'Type', sortable: true, width: '80px' },
            { key: 'item', header: 'Item', sortable: true },
            { key: 'seller', header: 'Seller', sortable: true },
            { key: 'buyer', header: 'Buyer', sortable: true },
            { key: 'amount', header: 'Amount', sortable: true, render: r => `${(r.amount as number).toLocaleString()} ¤` },
            { key: 'fee', header: 'Fee', sortable: true, render: r => `${(r.fee as number).toLocaleString()} ¤` },
            { key: 'date', header: 'Date', sortable: true },
          ]}
          data={transactions as unknown as Record<string, unknown>[]}
          keyExtractor={item => String(item.id)}
          pageSize={5}
        />
      </div>

      {selectedListing && (
        <Modal open={!!selectedListing} onOpenChange={o => !o && setSelectedListing(null)} title={selectedListing.title}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Seller</p>
                <p className="text-sm text-slate-200">@{selectedListing.sellerName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Price</p>
                <p className="text-sm text-slate-200">{selectedListing.price.toLocaleString()} ¤</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Category</p>
                <p className="text-sm text-slate-200">{selectedListing.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <Badge variant={selectedListing.status === 'active' ? 'success' : selectedListing.status === 'flagged' ? 'error' : selectedListing.status === 'sold' ? 'info' : 'default'}>
                  {selectedListing.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500">Views</p>
                <p className="text-sm text-slate-200">{selectedListing.views.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Reports</p>
                <p className="text-sm text-slate-200">{selectedListing.reports}</p>
              </div>
            </div>
            {selectedListing.status === 'flagged' && (
              <ModalFooter>
                <Button variant="ghost">Dismiss Flags</Button>
                <Button variant="danger">Remove Listing</Button>
              </ModalFooter>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
