'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  width?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  onRowClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize = 20,
  onRowClick,
  loading,
  emptyMessage = 'No data found',
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(item =>
      columns.some(col => {
        const val = item[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, columns])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-600" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-admin-400" />
      : <ChevronDown className="w-3.5 h-3.5 text-admin-400" />
  }

  return (
    <div className={cn('space-y-4', className)}>
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={searchPlaceholder}
            className="input-field pl-10"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-800/60">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/80">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'table-header',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-200',
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon columnKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {columns.map(col => (
                    <td key={col.key} className="table-cell">
                      <div className="h-4 w-24 rounded bg-slate-800/50 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map(item => (
                <tr
                  key={keyExtractor(item)}
                  className={cn(
                    'table-row',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map(col => (
                    <td key={col.key} className="table-cell">
                      {col.render ? col.render(item) : String(item[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost p-1.5 rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const p = start + i
              if (p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-md text-sm font-medium transition-colors',
                    p === page
                      ? 'bg-admin-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost p-1.5 rounded-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
