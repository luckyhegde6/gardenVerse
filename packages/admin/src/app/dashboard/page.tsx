'use client'

import { Users, Sprout, ShoppingCart, Activity, TrendingUp, TrendingDown, Globe, CreditCard, Server, Wifi, Clock, HardDrive } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { Chart } from '@/components/Chart'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { cn } from '@/lib/utils'

const userGrowthData = [
  { month: 'Jan', users: 1200, active: 850 },
  { month: 'Feb', users: 1900, active: 1400 },
  { month: 'Mar', users: 2800, active: 2100 },
  { month: 'Apr', users: 3600, active: 2900 },
  { month: 'May', users: 4200, active: 3500 },
  { month: 'Jun', users: 5100, active: 4300 },
  { month: 'Jul', users: 5900, active: 5000 },
  { month: 'Aug', users: 6800, active: 5600 },
  { month: 'Sep', users: 7900, active: 6400 },
  { month: 'Oct', users: 8700, active: 7100 },
  { month: 'Nov', users: 9400, active: 7800 },
  { month: 'Dec', users: 10200, active: 8500 },
]

const revenueData = [
  { month: 'Jan', revenue: 12000, credits: 45000 },
  { month: 'Feb', revenue: 18000, credits: 52000 },
  { month: 'Mar', revenue: 24000, credits: 61000 },
  { month: 'Apr', revenue: 28000, credits: 58000 },
  { month: 'May', revenue: 32000, credits: 72000 },
  { month: 'Jun', revenue: 38000, credits: 85000 },
  { month: 'Jul', revenue: 42000, credits: 91000 },
  { month: 'Aug', revenue: 45000, credits: 88000 },
  { month: 'Sep', revenue: 51000, credits: 102000 },
  { month: 'Oct', revenue: 55000, credits: 115000 },
  { month: 'Nov', revenue: 62000, credits: 128000 },
  { month: 'Dec', revenue: 68000, credits: 142000 },
]

const regionalData = [
  { region: 'North America', users: 3420, gardens: 2100, iot: 1800, active: 85 },
  { region: 'Europe', users: 2890, gardens: 1750, iot: 1500, active: 82 },
  { region: 'Asia Pacific', users: 4210, gardens: 3200, iot: 2900, active: 78 },
  { region: 'Latin America', users: 1560, gardens: 1200, iot: 800, active: 72 },
  { region: 'Middle East', users: 890, gardens: 650, iot: 400, active: 68 },
  { region: 'Africa', users: 620, gardens: 480, iot: 200, active: 65 },
]

const recentUsers = [
  { id: '1', username: 'green_thumb', email: 'sarah@example.com', level: 42, role: 'premium', status: 'active', joined: '2026-05-26', gardens: 3 },
  { id: '2', username: 'urban_farmer', email: 'mike@example.com', level: 28, role: 'user', status: 'active', joined: '2026-05-25', gardens: 1 },
  { id: '3', username: 'botany_king', email: 'alex@example.com', level: 56, role: 'moderator', status: 'active', joined: '2026-05-24', gardens: 5 },
  { id: '4', username: 'seed_saver', email: 'emma@example.com', level: 12, role: 'user', status: 'suspended', joined: '2026-05-23', gardens: 2 },
  { id: '5', username: 'compost_guru', email: 'james@example.com', level: 35, role: 'premium', status: 'active', joined: '2026-05-22', gardens: 4 },
]

const healthIndicators = [
  { label: 'API Latency', value: '42ms', status: 'healthy', icon: Clock },
  { label: 'Server Load', value: '23%', status: 'healthy', icon: Server },
  { label: 'Database', value: 'Connected', status: 'healthy', icon: HardDrive },
  { label: 'WebSocket', value: 'Active', status: 'healthy', icon: Wifi },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Daily Active Users"
          value={12580}
          change={12.5}
          changeLabel="vs last week"
          trend="up"
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Total Users"
          value={142890}
          change={8.2}
          changeLabel="this month"
          trend="up"
          icon={<Sprout className="w-6 h-6" />}
        />
        <StatCard
          title="Active Gardens"
          value={45230}
          change={-3.1}
          changeLabel="vs last week"
          trend="down"
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="Marketplace Volume"
          value={2845000}
          change={22.8}
          changeLabel="this month"
          trend="up"
          icon={<ShoppingCart className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User Growth</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+22% vs last year</span>
            </div>
          </div>
          <Chart
            data={userGrowthData}
            series={[
              { key: 'users', name: 'Total Users', color: '#22c55e' },
              { key: 'active', name: 'Active Users', color: '#3b82f6' },
            ]}
            kind="area"
            height={300}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue & Credits Flow</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CreditCard className="w-3.5 h-3.5" />
              <span>+18% MoM</span>
            </div>
          </div>
          <Chart
            data={revenueData}
            series={[
              { key: 'revenue', name: 'Revenue (USD)', color: '#22c55e' },
              { key: 'credits', name: 'Credits Issued', color: '#f59e0b' },
            ]}
            kind="bar"
            height={300}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="card-header">
            <h3 className="card-title">Regional Activity</h3>
            <Globe className="w-4 h-4 text-slate-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="table-header">Region</th>
                  <th className="table-header">Users</th>
                  <th className="table-header">Gardens</th>
                  <th className="table-header">IoT Devices</th>
                  <th className="table-header">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {regionalData.map(row => (
                  <tr key={row.region} className="table-row">
                    <td className="table-cell font-medium text-slate-200">{row.region}</td>
                    <td className="table-cell">{row.users.toLocaleString()}</td>
                    <td className="table-cell">{row.gardens.toLocaleString()}</td>
                    <td className="table-cell">{row.iot.toLocaleString()}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-admin-500"
                            style={{ width: `${row.active}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{row.active}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="card-header">
            <h3 className="card-title">System Health</h3>
            <Activity className="w-4 h-5 text-emerald-400" />
          </div>
          {healthIndicators.map(indicator => {
            const Icon = indicator.icon
            const statusColor = indicator.status === 'healthy' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'
            return (
              <div key={indicator.label} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', statusColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">{indicator.label}</p>
                    <p className="text-xs text-slate-500">{indicator.value}</p>
                  </div>
                </div>
                <Badge variant={indicator.status as 'success' | 'warning'} dot>
                  {indicator.status}
                </Badge>
              </div>
            )
          })}
          <div className="mt-2 p-3 rounded-lg bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Overall Uptime</span>
              <span className="text-xs font-medium text-emerald-400">99.97%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: '99.97%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Users</h3>
          <Badge variant="info">+12 today</Badge>
        </div>
        <DataTable
          columns={[
            { key: 'username', header: 'Username', sortable: true },
            { key: 'email', header: 'Email', sortable: true },
            { key: 'level', header: 'Level', sortable: true, width: '80px' },
            {
              key: 'role',
              header: 'Role',
              sortable: true,
              width: '100px',
              render: u => (
                <Badge variant={u.role === 'premium' ? 'success' : u.role === 'moderator' ? 'info' : 'default'}>
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
                <Badge variant={u.status as 'active' | 'suspended'} dot>
                  {u.status as string}
                </Badge>
              ),
            },
            { key: 'joined', header: 'Joined', sortable: true },
            { key: 'gardens', header: 'Gardens', sortable: true, width: '90px' },
          ]}
          data={recentUsers as unknown as Record<string, unknown>[]}
          keyExtractor={u => String(u.id)}
          searchable
          pageSize={5}
        />
      </div>
    </div>
  )
}
