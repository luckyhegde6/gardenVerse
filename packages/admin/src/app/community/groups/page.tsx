'use client'

import {
  Users,
  MessageSquare,
  Layers,
  Calendar,
  Hash,
  Tags,
} from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'

// ── Mock Data ──────────────────────────────────────────────

interface Group {
  id: string
  name: string
  memberCount: number
  postCount: number
  category: string
  status: 'active' | 'flagged' | 'suspended'
  createdDate: string
}

const mockGroups: Group[] = [
  { id: 'g1', name: 'Organic Farmers United', memberCount: 1240, postCount: 15200, category: 'Farming', status: 'active', createdDate: '2024-01-15' },
  { id: 'g2', name: 'City Gardeners', memberCount: 890, postCount: 8900, category: 'Gardening', status: 'active', createdDate: '2024-03-22' },
  { id: 'g3', name: 'Tropical Plant Enthusiasts', memberCount: 560, postCount: 6700, category: 'Horticulture', status: 'active', createdDate: '2024-06-10' },
  { id: 'g4', name: 'Compost Masters', memberCount: 320, postCount: 2100, category: 'Composting', status: 'active', createdDate: '2024-08-05' },
  { id: 'g5', name: 'Desert Farming Collective', memberCount: 180, postCount: 3400, category: 'Farming', status: 'active', createdDate: '2024-11-18' },
  { id: 'g6', name: 'Seed Swappers Anonymous', memberCount: 450, postCount: 12000, category: 'Trading', status: 'flagged', createdDate: '2024-02-28' },
  { id: 'g7', name: 'Permaculture Designers', memberCount: 715, postCount: 9800, category: 'Permaculture', status: 'active', createdDate: '2024-04-12' },
  { id: 'g8', name: 'Hydroponics Hub', memberCount: 290, postCount: 4100, category: 'Hydroponics', status: 'suspended', createdDate: '2024-09-30' },
  { id: 'g9', name: 'Rooftop Garden Revolution', memberCount: 635, postCount: 7800, category: 'Gardening', status: 'active', createdDate: '2024-05-08' },
  { id: 'g10', name: 'Native Plant Society', memberCount: 410, postCount: 5400, category: 'Conservation', status: 'active', createdDate: '2024-07-19' },
  { id: 'g11', name: 'Mushroom Growers Guild', memberCount: 275, postCount: 3200, category: 'Fungi', status: 'flagged', createdDate: '2024-10-02' },
  { id: 'g12', name: 'Aquaponics Innovators', memberCount: 195, postCount: 2600, category: 'Aquaponics', status: 'active', createdDate: '2025-01-14' },
  { id: 'g13', name: 'Herb Garden Circle', memberCount: 520, postCount: 6100, category: 'Herbs', status: 'active', createdDate: '2024-02-10' },
  { id: 'g14', name: 'Victory Garden Revival', memberCount: 380, postCount: 4700, category: 'Gardening', status: 'suspended', createdDate: '2024-12-01' },
  { id: 'g15', name: 'Soil Health Network', memberCount: 310, postCount: 3900, category: 'Composting', status: 'active', createdDate: '2025-03-05' },
]

// ── Derived Stats ──────────────────────────────────────────

const totalGroups = mockGroups.length
const totalMembers = mockGroups.reduce((s, g) => s + g.memberCount, 0)
const activeGroups = mockGroups.filter(g => g.status === 'active').length
const postsToday = 847

// ── Page Component ────────────────────────────────────────

export default function CommunityGroupsPage() {
  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────── */}
      <div>
        <h1 className="card-title text-2xl">Community Groups</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage and monitor all community groups across the platform.
        </p>
      </div>

      {/* ── Stats Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Groups"
          value={totalGroups}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Total Members"
          value={totalMembers}
          change={8.3}
          trend="up"
          icon={<Layers className="w-6 h-6" />}
          changeLabel="this quarter"
        />
        <StatCard
          title="Active Groups"
          value={activeGroups}
          change={2.1}
          trend="up"
          icon={<Hash className="w-6 h-6" />}
          changeLabel="vs last month"
        />
        <StatCard
          title="Posts Today"
          value={postsToday}
          change={-3.5}
          trend="down"
          icon={<MessageSquare className="w-6 h-6" />}
          changeLabel="vs yesterday"
        />
      </div>

      {/* ── Groups Table ──────────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Tags className="w-4 h-4 text-slate-500" />
          <h3 className="card-title text-sm">All Groups</h3>
        </div>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Group Name',
              sortable: true,
            },
            {
              key: 'memberCount',
              header: 'Members Count',
              sortable: true,
              width: '140px',
            },
            {
              key: 'postCount',
              header: 'Posts Count',
              sortable: true,
              width: '120px',
            },
            {
              key: 'category',
              header: 'Category',
              sortable: true,
              width: '140px',
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              width: '110px',
              render: g => (
                <Badge
                  variant={g.status as 'active' | 'flagged' | 'suspended'}
                  dot
                >
                  {g.status as string}
                </Badge>
              ),
            },
            {
              key: 'createdDate',
              header: 'Created Date',
              sortable: true,
              width: '130px',
              render: g => (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {g.createdDate as string}
                </span>
              ),
            },
          ]}
          data={mockGroups as unknown as Record<string, unknown>[]}
          keyExtractor={g => String(g.id)}
          searchable
          searchPlaceholder="Search groups by name, category, or status..."
          pageSize={10}
          emptyMessage="No community groups found."
        />
      </div>
    </div>
  )
}
