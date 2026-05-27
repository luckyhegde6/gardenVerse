'use client'

import { useState } from 'react'
import { BarChart3, Download, TrendingUp, Users, Gamepad2, ShoppingCart, Wifi, Globe } from 'lucide-react'
import { Chart } from '@/components/Chart'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Select } from '@/components/Select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'

const dauMauData = [
  { month: 'Jan', dau: 4200, mau: 8500 },
  { month: 'Feb', dau: 5100, mau: 9200 },
  { month: 'Mar', dau: 5800, mau: 10500 },
  { month: 'Apr', dau: 6200, mau: 11200 },
  { month: 'May', dau: 7100, mau: 12800 },
  { month: 'Jun', dau: 7800, mau: 13500 },
  { month: 'Jul', dau: 8400, mau: 14200 },
  { month: 'Aug', dau: 7900, mau: 13800 },
  { month: 'Sep', dau: 8600, mau: 14500 },
  { month: 'Oct', dau: 9200, mau: 15200 },
  { month: 'Nov', dau: 10100, mau: 16800 },
  { month: 'Dec', dau: 11200, mau: 18200 },
]

const retentionCohorts = [
  { cohort: 'Jan', week1: 100, week2: 68, week3: 55, week4: 48, week8: 35, week12: 28 },
  { cohort: 'Feb', week1: 100, week2: 72, week3: 58, week4: 52, week8: 38, week12: 30 },
  { cohort: 'Mar', week1: 100, week2: 75, week3: 62, week4: 55, week8: 42, week12: 33 },
  { cohort: 'Apr', week1: 100, week2: 70, week3: 60, week4: 50, week8: 40, week12: 31 },
  { cohort: 'May', week1: 100, week2: 78, week3: 65, week4: 58, week8: 45, week12: 35 },
  { cohort: 'Jun', week1: 100, week2: 74, week3: 63, week4: 56, week8: 43, week12: 34 },
]

const gameplayData = [
  { metric: 'Mar', sessions: 185000, quests: 42000, trades: 28000, pvp: 8500 },
  { metric: 'Apr', sessions: 210000, quests: 48000, trades: 32000, pvp: 10200 },
  { metric: 'May', sessions: 245000, quests: 52000, trades: 36000, pvp: 11800 },
  { metric: 'Jun', sessions: 268000, quests: 58000, trades: 41000, pvp: 13500 },
  { metric: 'Jul', sessions: 290000, quests: 62000, trades: 45000, pvp: 14800 },
  { metric: 'Aug', sessions: 275000, quests: 59000, trades: 42000, pvp: 14200 },
]

const marketMetrics = [
  { month: 'Jan', volume: 120000, transactions: 3400, activeSellers: 420 },
  { month: 'Feb', volume: 155000, transactions: 3900, activeSellers: 480 },
  { month: 'Mar', volume: 180000, transactions: 4500, activeSellers: 520 },
  { month: 'Apr', volume: 210000, transactions: 5100, activeSellers: 560 },
  { month: 'May', volume: 245000, transactions: 5800, activeSellers: 610 },
  { month: 'Jun', volume: 280000, transactions: 6400, activeSellers: 650 },
]

const iotData = [
  { month: 'Jan', devices: 1200, dataPoints: 450000, activeUsers: 800 },
  { month: 'Feb', devices: 1500, dataPoints: 520000, activeUsers: 1050 },
  { month: 'Mar', devices: 1900, dataPoints: 680000, activeUsers: 1300 },
  { month: 'Apr', devices: 2300, dataPoints: 820000, activeUsers: 1600 },
  { month: 'May', devices: 2800, dataPoints: 950000, activeUsers: 1900 },
  { month: 'Jun', devices: 3200, dataPoints: 1100000, activeUsers: 2200 },
]

const regionalBreakdown = [
  { region: 'North America', dau: 2850, mau: 5200, revenue: 185000, gardens: 2100 },
  { region: 'Europe', dau: 2400, mau: 4500, revenue: 152000, gardens: 1750 },
  { region: 'Asia Pacific', dau: 3500, mau: 6200, revenue: 198000, gardens: 3200 },
  { region: 'Latin America', dau: 1200, mau: 2400, revenue: 65000, gardens: 1200 },
  { region: 'Middle East', dau: 650, mau: 1400, revenue: 42000, gardens: 650 },
  { region: 'Africa', dau: 400, mau: 900, revenue: 18000, gardens: 480 },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6m')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '6m', label: 'Last 6 months' },
              { value: '1y', label: 'Last year' },
            ]}
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-36"
          />
          <Button variant="secondary">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="DAU / MAU Ratio" value="61.5%" change={3.2} trend="up" changeLabel="vs last month" icon={<Users className="w-6 h-6" />} />
        <StatCard title="Avg Session" value="24.5m" change={1.8} trend="up" changeLabel="vs last month" icon={<TrendingUp className="w-6 h-6" />} />
        <StatCard title="Retention (D7)" value="72.4%" change={5.1} trend="up" changeLabel="improving" icon={<Gamepad2 className="w-6 h-6" />} />
        <StatCard title="IoT Participation" value="32.8%" change={8.5} trend="up" changeLabel="growing" icon={<Wifi className="w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">DAU / MAU Trend</h3>
          </div>
          <Chart
            data={dauMauData}
            series={[
              { key: 'dau', name: 'Daily Active Users', color: '#22c55e' },
              { key: 'mau', name: 'Monthly Active Users', color: '#3b82f6' },
            ]}
            kind="line"
            height={280}
          />
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Retention Cohorts</h3>
          </div>
          <Chart
            data={retentionCohorts}
            series={[
              { key: 'week1', name: 'Week 1', color: '#22c55e' },
              { key: 'week2', name: 'Week 2', color: '#3b82f6' },
              { key: 'week4', name: 'Week 4', color: '#f59e0b' },
              { key: 'week8', name: 'Week 8', color: '#8b5cf6' },
              { key: 'week12', name: 'Week 12', color: '#06b6d4' },
            ]}
            kind="bar"
            height={280}
            xKey="cohort"
            stacked
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Gameplay Metrics</h3>
          </div>
          <Chart
            data={gameplayData}
            series={[
              { key: 'sessions', name: 'Sessions', color: '#22c55e' },
              { key: 'quests', name: 'Quests Completed', color: '#3b82f6' },
              { key: 'trades', name: 'Trades', color: '#f59e0b' },
              { key: 'pvp', name: 'PvP Battles', color: '#ef4444' },
            ]}
            kind="area"
            height={280}
          />
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Marketplace Volume & Transactions</h3>
          </div>
          <Chart
            data={marketMetrics}
            series={[
              { key: 'volume', name: 'Volume (¤)', color: '#22c55e' },
              { key: 'transactions', name: 'Transactions', color: '#f59e0b' },
            ]}
            kind="line"
            height={280}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">IoT Participation</h3>
          </div>
          <Chart
            data={iotData}
            series={[
              { key: 'devices', name: 'Connected Devices', color: '#22c55e' },
              { key: 'activeUsers', name: 'Active Users', color: '#06b6d4' },
            ]}
            kind="area"
            height={280}
          />
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Regional Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="table-header">Region</th>
                  <th className="table-header">DAU</th>
                  <th className="table-header">MAU</th>
                  <th className="table-header">Revenue</th>
                  <th className="table-header">Gardens</th>
                </tr>
              </thead>
              <tbody>
                {regionalBreakdown.map(row => (
                  <tr key={row.region} className="table-row">
                    <td className="table-cell font-medium text-slate-200">{row.region}</td>
                    <td className="table-cell">{row.dau.toLocaleString()}</td>
                    <td className="table-cell">{row.mau.toLocaleString()}</td>
                    <td className="table-cell">¤{row.revenue.toLocaleString()}</td>
                    <td className="table-cell">{row.gardens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
