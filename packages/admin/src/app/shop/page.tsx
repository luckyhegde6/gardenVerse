'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart,
  Package,
  Search,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
  Tag,
  CheckCircle2,
  X,
  CreditCard,
  Box,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { DataTable } from '@/components/DataTable'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import { Modal, ModalFooter } from '@/components/Modal'
import { cn, formatDateTime } from '@/lib/utils'
import api from '@/lib/api'

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  currency: string
  icon: string
  category: string
  levelRequired: number
  isLimited: boolean
  stock: number | null
  itemType?: string
  isOnSale?: boolean
  discountPrice?: number | null
  saleEndsAt?: string | null
}

interface PurchaseRecord {
  id: string
  userId: string
  user: { username: string; email: string }
  itemId: string
  itemName: string
  quantity: number
  totalPrice: number
  currency: string
  status: string
  createdAt: string
}

interface InventoryItem {
  id: string
  userId: string
  itemId: string
  itemName: string
  itemDescription: string
  itemIcon: string
  itemCategory: string
  quantity: number
  isActive: boolean
  acquiredAt: string
}

/* ────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'TOOL', label: 'Tools' },
  { value: 'FERTILIZER', label: 'Fertilizers' },
  { value: 'SEED', label: 'Seeds' },
  { value: 'DECORATION', label: 'Decorations' },
  { value: 'PLOT_UPGRADE', label: 'Plot Upgrades' },
]

const CATEGORY_LABELS: Record<string, string> = {
  TOOL: 'Tools',
  FERTILIZER: 'Fertilizers',
  SEED: 'Seeds',
  DECORATION: 'Decorations',
  PLOT_UPGRADE: 'Plot Upgrades',
}

const CATEGORY_COLORS: Record<string, string> = {
  TOOL: 'text-sky-400 bg-sky-400/10',
  FERTILIZER: 'text-emerald-400 bg-emerald-400/10',
  SEED: 'text-amber-400 bg-amber-400/10',
  DECORATION: 'text-purple-400 bg-purple-400/10',
  PLOT_UPGRADE: 'text-rose-400 bg-rose-400/10',
}

/* ────────────────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────────────────── */

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState('browse')

  /* ---- Browse State ---- */
  const [items, setItems] = useState<ShopItem[]>([])
  const [browseLoading, setBrowseLoading] = useState(true)
  const [browseError, setBrowseError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  /* ---- Buy Modal State ---- */
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [buyItem, setBuyItem] = useState<ShopItem | null>(null)
  const [buyQty, setBuyQty] = useState(1)
  const [couponCode, setCouponCode] = useState('')
  const [buySubmitting, setBuySubmitting] = useState(false)
  const [buyError, setBuyError] = useState<string | null>(null)
  const [buySuccess, setBuySuccess] = useState<string | null>(null)

  /* ---- Purchases State ---- */
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [purchasesError, setPurchasesError] = useState<string | null>(null)

  /* ---- Inventory State ---- */
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)

  /* ============================================================== */

  const fetchItems = useCallback(async () => {
    setBrowseLoading(true)
    setBrowseError(null)
    try {
      const res = await api.get('/shop', {
        params: {
          category: categoryFilter || undefined,
          search: searchQuery || undefined,
          limit: 100,
        },
      })
      const body = res.data as Record<string, unknown>
      const rawData = (body.data as unknown[]) ?? (Array.isArray(body) ? body : [])
      setItems(
        (rawData as Record<string, unknown>[]).map(i => ({
          id: String(i.id ?? ''),
          name: String(i.name ?? ''),
          description: String(i.description ?? ''),
          price: typeof i.price === 'number' ? i.price : Number(i.price ?? 0),
          currency: String(i.currency ?? 'GREEN_CREDITS'),
          icon: String(i.icon ?? 'Box'),
          category: String(i.category ?? ''),
          levelRequired: typeof i.levelRequired === 'number' ? i.levelRequired : Number(i.levelRequired ?? 1),
          isLimited: Boolean(i.isLimited ?? false),
          stock: i.stock != null ? Number(i.stock) : null,
          itemType: i.itemType ? String(i.itemType) : undefined,
          isOnSale: i.isOnSale != null ? Boolean(i.isOnSale) : false,
          discountPrice: i.discountPrice != null ? Number(i.discountPrice) : null,
          saleEndsAt: i.saleEndsAt ? String(i.saleEndsAt) : null,
        }))
      )
    } catch {
      setBrowseError('Failed to load shop items.')
      setItems([])
    } finally {
      setBrowseLoading(false)
    }
  }, [categoryFilter, searchQuery])

  const fetchPurchases = useCallback(async () => {
    setPurchasesLoading(true)
    setPurchasesError(null)
    try {
      const res = await api.get('/rewards/transactions', {
        params: { type: 'shop_purchase', limit: 50 },
      })
      const body = res.data as Record<string, unknown>
      const rawData = (body.data as unknown[]) ?? (Array.isArray(body) ? body : [])
      setPurchases(
        (rawData as Record<string, unknown>[]).map(p => ({
          id: String(p.id ?? ''),
          userId: String(p.userId ?? ''),
          user: (p.user as { username: string; email: string }) ?? { username: 'Unknown', email: '' },
          itemId: String(p.itemId ?? ''),
          itemName: String(p.itemName ?? ''),
          quantity: typeof p.quantity === 'number' ? p.quantity : Number(p.quantity ?? 1),
          totalPrice: typeof p.totalPrice === 'number' ? p.totalPrice : Number(p.totalPrice ?? 0),
          currency: String(p.currency ?? 'GREEN_CREDITS'),
          status: String(p.status ?? 'completed'),
          createdAt: String(p.createdAt ?? ''),
        }))
      )
    } catch {
      setPurchasesError('Failed to load purchase history.')
      setPurchases([])
    } finally {
      setPurchasesLoading(false)
    }
  }, [])

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true)
    setInventoryError(null)
    try {
      const res = await api.get('/shop/inventory', { params: { limit: 100 } })
      const body = res.data as Record<string, unknown>
      const rawData = (body.data as unknown[]) ?? (Array.isArray(body) ? body : [])
      setInventory(
        (rawData as Record<string, unknown>[]).map(inv => ({
          id: String(inv.id ?? ''),
          userId: String(inv.userId ?? ''),
          itemId: String(inv.itemId ?? ''),
          itemName: String(inv.itemName ?? ''),
          itemDescription: String(inv.itemDescription ?? ''),
          itemIcon: String(inv.itemIcon ?? 'Box'),
          itemCategory: String(inv.itemCategory ?? ''),
          quantity: typeof inv.quantity === 'number' ? inv.quantity : Number(inv.quantity ?? 1),
          isActive: Boolean(inv.isActive ?? false),
          acquiredAt: String(inv.acquiredAt ?? ''),
        }))
      )
    } catch {
      setInventoryError('Failed to load inventory.')
      setInventory([])
    } finally {
      setInventoryLoading(false)
    }
  }, [])

  /* ============================================================== */

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    if (activeTab === 'purchases') fetchPurchases()
  }, [activeTab, fetchPurchases])

  useEffect(() => {
    if (activeTab === 'inventory') fetchInventory()
  }, [activeTab, fetchInventory])

  /* ============================================================== */

  const openBuyModal = (item: ShopItem) => {
    setBuyItem(item)
    setBuyQty(1)
    setCouponCode('')
    setBuyError(null)
    setBuySuccess(null)
    setShowBuyModal(true)
  }

  const handleBuySubmit = useCallback(async () => {
    if (!buyItem) return
    setBuyError(null)
    setBuySuccess(null)
    setBuySubmitting(true)

    try {
      await api.post('/shop/buy', {
        itemId: buyItem.id,
        quantity: buyQty,
        couponCode: couponCode.trim() || undefined,
      })
      setBuySuccess(`Successfully purchased ${buyQty}x ${buyItem.name}!`)
      fetchItems()
      setTimeout(() => setShowBuyModal(false), 1500)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Error: ${(err as { response: { data?: { error?: string }; status: number } }).response?.data?.error ?? (err as { response: { status: number } }).response?.status ?? 'Unknown'}`
          : 'Purchase failed. Please try again.'
      setBuyError(message)
    } finally {
      setBuySubmitting(false)
    }
  }, [buyItem, buyQty, couponCode, fetchItems])

  const effectivePrice = buyItem
    ? buyItem.isOnSale && buyItem.discountPrice != null
      ? buyItem.discountPrice
      : buyItem.price
    : 0

  const filteredItems = items.filter(item => {
    if (categoryFilter && item.category !== categoryFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    }
    return true
  })

  /* ============================================================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-400/10">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Shop</h1>
            <p className="text-sm text-slate-500">Browse and manage in-game store items</p>
          </div>
        </div>
        <Badge variant="success" dot>{items.length} items</Badge>
      </div>

      {/* Success Banner */}
      {buySuccess && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">{buySuccess}</p>
        </div>
      )}

      {/* TABS */}
      <TabsRoot value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════
            TAB 1: BROWSE
            ════════════════════════════════════════ */}
        <TabsContent value="browse">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="input-field pl-10"
              />
            </div>
            <div className="w-44">
              <Select
                options={CATEGORY_OPTIONS}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={fetchItems} disabled={browseLoading}>
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>

          {/* Error */}
          {browseError && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300 flex-1">{browseError}</p>
              <Button variant="ghost" size="sm" onClick={fetchItems}>Retry</Button>
            </div>
          )}

          {/* Loading */}
          {browseLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
            </div>
          ) : filteredItems.length === 0 && !browseError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm text-slate-500">No shop items found.</p>
            </div>
          ) : (
            /* Items Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const onSale = item.isOnSale && item.discountPrice != null
                return (
                  <div key={item.id} className="card group hover:border-slate-700/80 transition-all">
                    {/* Sale badge */}
                    {onSale && (
                      <div className="flex items-center gap-1 mb-2">
                        <Badge variant="warning">
                          <Tag className="w-3 h-3 mr-1" />
                          SALE
                        </Badge>
                        {item.saleEndsAt && (
                          <span className="text-[10px] text-slate-500">
                            Ends {formatDateTime(item.saleEndsAt)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-admin-500/10 text-admin-400 mb-3 group-hover:bg-admin-500/20 transition-colors">
                      <Package className="w-6 h-6" />
                    </div>

                    {/* Name & Description */}
                    <h4 className="text-sm font-semibold text-slate-200">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>

                    {/* Category */}
                    <div className="mt-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
                        CATEGORY_COLORS[item.category] ?? 'text-slate-400 bg-slate-400/10'
                      )}>
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                    </div>

                    {/* Level requirement & stock */}
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                      <span>Lv.{item.levelRequired}+</span>
                      {item.isLimited && item.stock != null ? (
                        <span className={item.stock <= 5 ? 'text-red-400' : 'text-slate-400'}>
                          {item.stock} left
                        </span>
                      ) : (
                        <span>Unlimited</span>
                      )}
                    </div>

                    {/* Price & Buy */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-1.5">
                        {onSale ? (
                          <>
                            <span className="text-lg font-bold text-emerald-400">{item.discountPrice}</span>
                            <span className="text-xs text-slate-500 line-through">{item.price}</span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-emerald-400">{item.price}</span>
                        )}
                        <span className="text-xs text-slate-500">{item.currency === 'GREEN_CREDITS' ? 'GC' : 'EP'}</span>
                      </div>
                      <Button size="sm" onClick={() => openBuyModal(item)}>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Buy
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════
            TAB 2: PURCHASES
            ════════════════════════════════════════ */}
        <TabsContent value="purchases">
          {purchasesError && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300 flex-1">{purchasesError}</p>
              <Button variant="ghost" size="sm" onClick={fetchPurchases}>Retry</Button>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Purchase History</h3>
              <CreditCard className="w-4 h-4 text-slate-500" />
            </div>
            <DataTable
              columns={[
                { key: 'createdAt', header: 'Date', sortable: true, width: '150px', render: r => (
                  <span className="text-xs text-slate-400">{formatDateTime(r.createdAt as string)}</span>
                )},
                { key: 'itemName', header: 'Item', sortable: true, render: r => (
                  <span className="text-sm font-medium text-slate-200">{r.itemName as string}</span>
                )},
                { key: 'user', header: 'User', sortable: true, width: '150px', render: r => {
                  const u = r.user as { username: string; email: string }
                  return <span className="text-sm text-slate-300">{u.username}</span>
                }},
                { key: 'quantity', header: 'Qty', sortable: true, width: '60px' },
                { key: 'totalPrice', header: 'Total', sortable: true, width: '100px', render: r => {
                  const val = r.totalPrice as number
                  return <span className="font-mono text-emerald-400">{val.toLocaleString()}</span>
                }},
                { key: 'currency', header: 'Currency', width: '100px', render: r => (
                  <Badge variant={r.currency === 'GREEN_CREDITS' ? 'success' : 'info'}>
                    {r.currency === 'GREEN_CREDITS' ? 'GC' : 'EP'}
                  </Badge>
                )},
                { key: 'status', header: 'Status', sortable: true, width: '100px', render: r => {
                  const s = r.status as string
                  return <Badge variant={s === 'completed' ? 'success' : s === 'refunded' ? 'warning' : 'default'} dot>{s}</Badge>
                }},
              ]}
              data={purchases as unknown as Record<string, unknown>[]}
              keyExtractor={r => r.id as string}
              loading={purchasesLoading}
              emptyMessage="No purchases found."
            />
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════
            TAB 3: INVENTORY
            ════════════════════════════════════════ */}
        <TabsContent value="inventory">
          {inventoryError && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300 flex-1">{inventoryError}</p>
              <Button variant="ghost" size="sm" onClick={fetchInventory}>Retry</Button>
            </div>
          )}

          {inventoryLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
            </div>
          ) : inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Box className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm text-slate-500">No items in inventory.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventory.map(inv => (
                <div key={inv.id} className={cn(
                  'card transition-all',
                  inv.isActive ? 'border-emerald-500/30' : ''
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-admin-500/10 text-admin-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <Badge variant={inv.isActive ? 'success' : 'default'} dot>
                      {inv.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">{inv.itemName}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{inv.itemDescription}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500">Qty: <strong className="text-slate-300">{inv.quantity}</strong></span>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
                      CATEGORY_COLORS[inv.itemCategory] ?? 'text-slate-400 bg-slate-400/10'
                    )}>
                      {CATEGORY_LABELS[inv.itemCategory] ?? inv.itemCategory}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2">
                    Acquired {formatDateTime(inv.acquiredAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </TabsRoot>

      {/* ════════════════════════════════════════
          BUY MODAL
          ════════════════════════════════════════ */}
      <Modal
        open={showBuyModal}
        onOpenChange={setShowBuyModal}
        title={buyItem ? `Purchase: ${buyItem.name}` : 'Purchase Item'}
      >
        {buyItem && (
          <div className="space-y-4">
            {/* Item Summary */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-admin-500/10 text-admin-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{buyItem.name}</p>
                <p className="text-xs text-slate-500">{buyItem.description}</p>
              </div>
              <div className="ml-auto text-right">
                {buyItem.isOnSale && buyItem.discountPrice != null ? (
                  <>
                    <p className="text-sm font-bold text-emerald-400">{buyItem.discountPrice} GC</p>
                    <p className="text-xs text-slate-500 line-through">{buyItem.price} GC</p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-emerald-400">{buyItem.price} GC</p>
                )}
              </div>
            </div>

            {/* Error */}
            {buyError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{buyError}</p>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBuyQty(q => Math.max(1, q - 1))}
                  disabled={buyQty <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-bold text-slate-100 w-8 text-center">{buyQty}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBuyQty(q => q + 1)}
                  disabled={buyItem.isLimited && buyItem.stock != null && buyQty >= buyItem.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Coupon */}
            <Input
              id="coupon-code"
              label="Coupon Code (optional)"
              placeholder="Enter coupon code..."
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
            />

            {/* Total */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <span className="text-sm text-slate-300">Total</span>
              <span className="text-lg font-bold text-emerald-400">
                {(effectivePrice * buyQty).toLocaleString()} GC
              </span>
            </div>

            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowBuyModal(false)} disabled={buySubmitting}>
                Cancel
              </Button>
              <Button onClick={handleBuySubmit} loading={buySubmitting} disabled={buySubmitting}>
                <ShoppingCart className="w-4 h-4" />
                {buySubmitting ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  )
}
