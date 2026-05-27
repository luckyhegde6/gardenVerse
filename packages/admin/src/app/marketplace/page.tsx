'use client'

import { useState } from 'react'
import { Store, Flag, Scale, Tags, Receipt, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge, type BadgeVariant } from '@/components/Badge'
import { DataTable } from '@/components/DataTable'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import { StatCard } from '@/components/StatCard'

const mockListings = [
  { id: 'l1', title: 'Golden Rose Seeds (Rare)', sellerName: 'rare_plant_lover', price: 2500, category: 'Seeds', status: 'active', createdAt: '2026-05-20', reports: 0, views: 342 },
  { id: 'l2', title: 'Fertilizer Bundle x10', sellerName: 'green_thumb', price: 500, category: 'Items', status: 'active', createdAt: '2026-05-19', reports: 0, views: 156 },
  { id: 'l3', title: 'Diamond Watering Can', sellerName: 'terra_master', price: 15000, category: 'Tools', status: 'active', createdAt: '2026-05-18', reports: 1, views: 890 },
  { id: 'l4', title: '"Rare" Blue Lotus Seeds', sellerName: 'fake_seed_seller', price: 8000, category: 'Seeds', status: 'flagged', createdAt: '2026-05-17', reports: 5, views: 1200 },
  { id: 'l5', title: 'Mystery Seed Pack', sellerName: 'mystery_box_scam', price: 3000, category: 'Seeds', status: 'flagged', createdAt: '2026-05-16', reports: 3, views: 2500 },
  { id: 'l6', title: 'Ancient Compost Recipe', sellerName: 'compost_master', price: 12000, category: 'Blueprints', status: 'sold', createdAt: '2026-05-15', reports: 0, views: 450 },
  { id: 'l7', title: 'Garden Expansion Plot', sellerName: 'plot_dealer', price: 50000, category: 'Land', status: 'active', createdAt: '2026-05-14', reports: 0, views: 678 },
  { id: 'l8', title: 'Rainwater Collector v2', sellerName: 'eco_engineer', price: 7500, category: 'Tools', status: 'active', createdAt: '2026-05-13', reports: 0, views: 234 },
  { id: 'l9', title: 'Glowberry Bush (Bugged?)', sellerName: 'confused_user', price: 100, category: 'Plants', status: 'flagged', createdAt: '2026-05-12', reports: 2, views: 89 },
  { id: 'l10', title: 'XP Boost Potion', sellerName: 'alchemist_joe', price: 3500, category: 'Items', status: 'removed', createdAt: '2026-05-11', reports: 8, views: 2100 },
]

const categories = [
  { name: 'Seeds', count: 2450, active: 2100 },
  { name: 'Plants', count: 1800, active: 1500 },
  { name: 'Tools', count: 920, active: 780 },
  { name: 'Items', count: 1500, active: 1200 },
  { name: 'Blueprints', count: 340, active: 290 },
  { name: 'Land', count: 120, active: 95 },
]

const transactions = [
  { id: 'tx1', type: 'Listing', item: 'Golden Rose Seeds', seller: 'rare_plant_lover', buyer: 'collector_mike', amount: 2500, fee: 125, date: '2026-05-27 14:32' },
  { id: 'tx2', type: 'Listing', item: 'Fertilizer Bundle', seller: 'green_thumb', buyer: 'new_farmer', amount: 500, fee: 25, date: '2026-05-27 12:15' },
  { id: 'tx3', type: 'Auction', item: 'Ancient Compost Recipe', seller: 'compost_master', buyer: 'whale_buyer', amount: 12000, fee: 600, date: '2026-05-26 20:00' },
  { id: 'tx4', type: 'Listing', item: 'Garden Expansion Plot', seller: 'plot_dealer', buyer: 'land_baron', amount: 50000, fee: 2500, date: '2026-05-26 18:45' },
  { id: 'tx5', type: 'Trade', item: 'Rare Cactus x3', seller: 'desert_rose', buyer: 'cactus_collector', amount: 0, fee: 0, date: '2026-05-26 16:30' },
]

export default function MarketplacePage() {
  const [tab, setTab] = useState('all')
  const [selectedListing, setSelectedListing] = useState<typeof mockListings[0] | null>(null)

  const filtered = tab === 'all' ? mockListings : mockListings.filter(l => l.status === tab)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Listings" value={8450} change={5.2} trend="up" icon={<Store className="w-6 h-6" />} changeLabel="this week" />
        <StatCard title="Flagged Items" value={23} change={-12} trend="down" icon={<Flag className="w-6 h-6" />} changeLabel="vs last week" />
        <StatCard title="Open Disputes" value={8} change={2} trend="up" icon={<Scale className="w-6 h-6" />} changeLabel="new today" />
        <StatCard title="Volume (7d)" value={284500} change={18.3} trend="up" icon={<Receipt className="w-6 h-6" />} changeLabel="vs last week" />
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
                    {mockListings.filter(l => l.status === 'flagged').length}
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
                onRowClick={r => setSelectedListing(r as typeof mockListings[0])}
                pageSize={8}
              />
            </TabsContent>
          </TabsRoot>
        </div>

        <div className="card">
          <h3 className="card-title mb-4">Categories</h3>
          <div className="space-y-3">
            {categories.map(cat => (
              <div key={cat.name} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Tags className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-300">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-200">{cat.count.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{cat.active} active</p>
                </div>
              </div>
            ))}
          </div>
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
                <Badge variant={selectedListing.status as BadgeVariant}>
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
