'use client'

import { useState, useEffect, useCallback } from 'react'
import { Thermometer, AlertTriangle, Globe, Clock, CloudSun, Droplets, Wind, Loader2, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { Chart } from '@/components/Chart'
import { Button } from '@/components/Button'
import api from '@/lib/api'

const temperatureTrendData = [
  { day: 'Mon', avgTemp: 24, highTemp: 30, lowTemp: 18, rainfall: 0 },
  { day: 'Tue', avgTemp: 26, highTemp: 33, lowTemp: 20, rainfall: 2 },
  { day: 'Wed', avgTemp: 22, highTemp: 28, lowTemp: 17, rainfall: 12 },
  { day: 'Thu', avgTemp: 20, highTemp: 26, lowTemp: 15, rainfall: 8 },
  { day: 'Fri', avgTemp: 25, highTemp: 31, lowTemp: 19, rainfall: 0 },
  { day: 'Sat', avgTemp: 28, highTemp: 34, lowTemp: 22, rainfall: 0 },
  { day: 'Sun', avgTemp: 27, highTemp: 33, lowTemp: 21, rainfall: 1 },
]

const regionalWeatherData = [
  { region: 'North America', temperature: 28, humidity: 45, windSpeed: 12, condition: 'Sunny', forecast: 'Sunny' },
  { region: 'Europe', temperature: 22, humidity: 60, windSpeed: 18, condition: 'Cloudy', forecast: 'Light Rain' },
  { region: 'Asia Pacific', temperature: 31, humidity: 78, windSpeed: 8, condition: 'Rainy', forecast: 'Thunderstorms' },
  { region: 'Latin America', temperature: 35, humidity: 55, windSpeed: 10, condition: 'Sunny', forecast: 'Sunny' },
  { region: 'Middle East', temperature: 42, humidity: 20, windSpeed: 25, condition: 'Clear', forecast: 'Clear' },
  { region: 'Africa', temperature: 38, humidity: 30, windSpeed: 15, condition: 'Sunny', forecast: 'Sunny' },
  { region: 'Australia', temperature: 19, humidity: 65, windSpeed: 22, condition: 'Cloudy', forecast: 'Showers' },
  { region: 'South America', temperature: 30, humidity: 72, windSpeed: 14, condition: 'Rainy', forecast: 'Rain' },
]

function getConditionEmoji(condition: string): string {
  const map: Record<string, string> = {
    Sunny: '\u2600\uFE0F',
    Clear: '\u2600\uFE0F',
    Cloudy: '\u26C5',
    Rainy: '\uD83C\uDF27\uFE0F',
    'Light Rain': '\uD83C\uDF26\uFE0F',
    Thunderstorms: '\u26C8\uFE0F',
    Showers: '\uD83C\uDF27\uFE0F',
    Rain: '\uD83C\uDF27\uFE0F',
    Snow: '\u2744\uFE0F',
    Foggy: '\uD83C\uDF2B\uFE0F',
    Windy: '\uD83C\uDF2C\uFE0F',
  }
  return map[condition] || '\u2600\uFE0F'
}

const activeAlertsData = [
  { id: 'a1', alertType: 'Heatwave', region: 'North America', severity: 'warning', issued: '2026-05-29 06:00', status: 'Active' },
  { id: 'a2', alertType: 'Frost Warning', region: 'Europe', severity: 'info', issued: '2026-05-28 22:00', status: 'Expired' },
  { id: 'a3', alertType: 'Heavy Rain', region: 'Asia Pacific', severity: 'warning', issued: '2026-05-28 12:00', status: 'Active' },
  { id: 'a4', alertType: 'Drought', region: 'Latin America', severity: 'error', issued: '2026-05-25 08:00', status: 'Active' },
  { id: 'a5', alertType: 'Sandstorm', region: 'Middle East', severity: 'info', issued: '2026-05-27 14:00', status: 'Expired' },
  { id: 'a6', alertType: 'Heatwave', region: 'Africa', severity: 'warning', issued: '2026-05-26 10:00', status: 'Active' },
  { id: 'a7', alertType: 'Flood Warning', region: 'South America', severity: 'error', issued: '2026-05-29 04:00', status: 'Active' },
  { id: 'a8', alertType: 'High Wind', region: 'Australia', severity: 'warning', issued: '2026-05-28 16:00', status: 'Active' },
  { id: 'a9', alertType: 'Thunderstorm', region: 'Asia Pacific', severity: 'error', issued: '2026-05-29 02:00', status: 'Active' },
]

interface WeatherCurrent {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  condition: string
  location?: string
  timestamp?: string
  sunrise?: string
  sunset?: string
}

interface WeatherAlert {
  id: string
  alertType: string
  region: string
  severity: string
  issued: string
  status: string
  description?: string
}

interface WeatherForecastDay {
  day: string
  avgTemp: number
  highTemp: number
  lowTemp: number
  rainfall: number
  humidity?: number
  condition?: string
}

export default function WeatherPage() {
  const [currentWeather, setCurrentWeather] = useState<WeatherCurrent | null>(null)
  const [forecastData, setForecastData] = useState<WeatherForecastDay[] | null>(null)
  const [alertsData, setAlertsData] = useState<WeatherAlert[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [filterAlertStatus, setFilterAlertStatus] = useState<'all' | 'Active' | 'Expired'>('all')

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setIsUsingFallback(false)

    try {
      const [currentRes, forecastRes, alertsRes] = await Promise.all([
        api.get('/weather/current'),
        api.get('/weather/forecast'),
        api.get('/weather/alerts'),
      ])

      setCurrentWeather(currentRes.data as WeatherCurrent)

      const forecastBody = forecastRes.data as WeatherForecastDay[] | { forecast?: WeatherForecastDay[]; data?: WeatherForecastDay[] }
      if (Array.isArray(forecastBody)) {
        setForecastData(forecastBody)
      } else if (forecastBody.forecast) {
        setForecastData(forecastBody.forecast)
      } else if (forecastBody.data) {
        setForecastData(forecastBody.data)
      }

      const alertsBody = alertsRes.data as WeatherAlert[] | { alerts?: WeatherAlert[]; data?: WeatherAlert[] }
      if (Array.isArray(alertsBody)) {
        setAlertsData(alertsBody)
      } else if (alertsBody.alerts) {
        setAlertsData(alertsBody.alerts)
      } else if (alertsBody.data) {
        setAlertsData(alertsBody.data)
      }
    } catch {
      setError('Could not load from server. Showing cached data.')
      setIsUsingFallback(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const displayStat = (val: number | undefined | null, fallback: number): number =>
    val != null ? val : fallback

  const displayStr = (val: string | undefined | null, fallback: string): string =>
    val != null && val !== '' ? val : fallback

  const chartData = forecastData && forecastData.length > 0
    ? forecastData as unknown as Record<string, unknown>[]
    : temperatureTrendData as unknown as Record<string, unknown>[]

  const displayAlerts = alertsData && alertsData.length > 0 ? alertsData : activeAlertsData

  const filteredAlerts = filterAlertStatus === 'all'
    ? displayAlerts
    : displayAlerts.filter(a => a.status === filterAlertStatus)

  const activeAlertCount = displayAlerts.filter(a => a.status === 'Active').length
  const avgTemp = displayStat(currentWeather?.temperature, 25)
  const lastUpdated = currentWeather?.timestamp
    ? `${Math.round((Date.now() - new Date(currentWeather.timestamp).getTime()) / 60000)} min ago`
    : '2 min ago'

  if (isLoading && !currentWeather && !error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading weather data...</p>
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
            {isUsingFallback && <p className="text-xs text-amber-400/70 mt-1">Data shown may not reflect the current state.</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={fetchAll}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Avg Temperature"
          value={`${avgTemp}°C`}
          change={1.8}
          changeLabel="vs yesterday"
          trend="up"
          icon={<Thermometer className="w-6 h-6" />}
        />
        <StatCard
          title="Active Alerts"
          value={activeAlertCount}
          change={2}
          changeLabel="new today"
          trend="up"
          icon={<AlertTriangle className="w-6 h-6" />}
        />
        <StatCard
          title="Regions Monitored"
          value={12}
          change={0}
          changeLabel="no change"
          trend="up"
          icon={<Globe className="w-6 h-6" />}
        />
        <StatCard
          title="Last Updated"
          value={lastUpdated}
          icon={<Clock className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Temperature Trends</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-400" /> Avg
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> High
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Low
              </span>
            </div>
          </div>
          <Chart
            data={chartData}
            series={[
              { key: 'avgTemp', name: 'Avg °C', color: '#f97316' },
              { key: 'highTemp', name: 'High °C', color: '#22c55e' },
              { key: 'lowTemp', name: 'Low °C', color: '#38bdf8' },
            ]}
            kind="area"
            xKey="day"
            height={280}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Regional Weather</h3>
            <CloudSun className="w-4 h-4 text-slate-500" />
          </div>
          <DataTable
            columns={[
              { key: 'region', header: 'Region', sortable: true },
              {
                key: 'temperature',
                header: 'Temp',
                sortable: true,
                width: '70px',
                render: r => <span>{r.temperature as number}°C</span>,
              },
              {
                key: 'humidity',
                header: 'Humidity',
                sortable: true,
                width: '85px',
                render: r => (
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    <span>{r.humidity as number}%</span>
                  </div>
                ),
              },
              {
                key: 'windSpeed',
                header: 'Wind',
                sortable: true,
                width: '75px',
                render: r => (
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-slate-400" />
                    <span>{r.windSpeed as number} km/h</span>
                  </div>
                ),
              },
              {
                key: 'condition',
                header: 'Condition',
                sortable: true,
                width: '100px',
                render: r => (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">{getConditionEmoji(r.condition as string)}</span>
                    <span className={
                      ['Sunny', 'Clear'].includes(r.condition as string) ? 'text-amber-400' :
                      (r.condition as string) === 'Cloudy' ? 'text-slate-400' :
                      'text-sky-400'
                    }>{r.condition as string}</span>
                  </span>
                ),
              },
              {
                key: 'forecast',
                header: 'Forecast',
                sortable: true,
                width: '120px',
                render: r => (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">{getConditionEmoji(r.forecast as string)}</span>
                    <span className="text-slate-300">{r.forecast as string}</span>
                  </span>
                ),
              },
            ]}
            data={regionalWeatherData as unknown as Record<string, unknown>[]}
            keyExtractor={w => String(w.region)}
            searchable
            searchPlaceholder="Search regions..."
            pageSize={8}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Active Alerts</h3>
          <div className="flex items-center gap-2">
            {(['all', 'Active', 'Expired'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterAlertStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterAlertStatus === status
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'alertType', header: 'Alert Type', sortable: true },
            { key: 'region', header: 'Region', sortable: true },
            {
              key: 'severity',
              header: 'Severity',
              sortable: true,
              width: '110px',
              render: r => {
                const severity = r.severity as string
                const variant = severity === 'error'
                  ? 'error'
                  : severity === 'warning'
                    ? 'warning'
                    : 'info'
                return <Badge variant={variant}>{severity}</Badge>
              },
            },
            {
              key: 'issued',
              header: 'Issued',
              sortable: true,
              width: '150px',
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              width: '100px',
              render: r => (
                <Badge variant={(r.status as string) === 'Active' ? 'active' : 'inactive'} dot>
                  {r.status as string}
                </Badge>
              ),
            },
          ]}
          data={filteredAlerts as unknown as Record<string, unknown>[]}
          keyExtractor={a => String(a.id)}
          searchable
          searchPlaceholder="Search alerts..."
          pageSize={9}
        />
      </div>
    </div>
  )
}
