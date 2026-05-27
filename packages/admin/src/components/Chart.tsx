'use client'

import { useId } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from 'recharts'
import { cn } from '@/lib/utils'

type ChartKind = 'line' | 'bar' | 'area' | 'pie'

interface ChartSeries {
  key: string
  name: string
  color?: string
}

interface ChartProps {
  data: Record<string, unknown>[]
  series: ChartSeries[]
  kind?: ChartKind
  xKey?: string
  height?: number
  className?: string
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  stacked?: boolean
}

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
]

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export function Chart({
  data,
  series,
  kind = 'line',
  xKey = 'name',
  height = 300,
  className,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  stacked = false,
}: ChartProps) {
  const id = useId()

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 5, bottom: 5, left: 0 },
    }

    switch (kind) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />}
            <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />}
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color || COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />}
            <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />}
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color || COLORS[i % COLORS.length]}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />}
            <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />}
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color || COLORS[i % COLORS.length]}
                fill={s.color || COLORS[i % COLORS.length]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={series[0]?.key || 'value'}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={`cell-${id}-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />}
          </PieChart>
        )
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
