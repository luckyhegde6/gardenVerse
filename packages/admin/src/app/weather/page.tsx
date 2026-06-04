'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Thermometer, AlertTriangle, Globe, Clock, CloudSun, Droplets, Wind,
  Loader2, AlertCircle, Sun, RefreshCw, Plus, Search,
} from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { Chart } from '@/components/Chart'
import { Button } from '@/components/Button'
import { Modal, ModalFooter } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import api from '@/lib/api'

const INDIAN_CITIES = [
  'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Bhopal',
  'Patna', 'Surat', 'Indore', 'Thiruvananthapuram', 'Guwahati', 'Bhubaneswar',
] as const

type IndianCity = (typeof INDIAN_CITIES)[number]

const SEASON_LABELS: Record<string, { season: string; desc: string }> = {
  Mumbai: { season: 'Monsoon (Kharif)', desc: 'Southwest monsoon active' },
  Chennai: { season: 'Monsoon (Kharif)', desc: 'Northeast monsoon prep' },
  Delhi: { season: 'Pre-Monsoon (Zaid)', desc: 'Transition to Kharif' },
  Kolkata: { season: 'Monsoon (Kharif)', desc: 'Peak wet season' },
  Bangalore: { season: 'Monsoon (Kharif)', desc: 'Moderate rainfall' },
  Hyderabad: { season: 'Pre-Monsoon (Zaid)', desc: 'Dry spell continues' },
  Pune: { season: 'Monsoon (Kharif)', desc: 'Southwest monsoon' },
  Ahmedabad: { season: 'Monsoon (Kharif)', desc: 'Humid with rains' },
  Jaipur: { season: 'Pre-Monsoon (Zaid)', desc: 'Dry heat' },
  Lucknow: { season: 'Pre-Monsoon (Zaid)', desc: 'Hot and dry' },
  Chandigarh: { season: 'Pre-Monsoon (Zaid)', desc: 'Pleasant before rains' },
  Bhopal: { season: 'Monsoon (Kharif)', desc: 'Intermittent showers' },
  Patna: { season: 'Monsoon (Kharif)', desc: 'High humidity' },
  Surat: { season: 'Monsoon (Kharif)', desc: 'Heavy rainfall expected' },
  Indore: { season: 'Pre-Monsoon (Zaid)', desc: 'Hot with dry winds' },
  Thiruvananthapuram: { season: 'Monsoon (Kharif)', desc: 'Early monsoon onset' },
  Guwahati: { season: 'Monsoon (Kharif)', desc: 'Heavy rainfall' },
  Bhubaneswar: { season: 'Monsoon (Kharif)', desc: 'Coastal humidity' },
}

const temperatureTrendData = [
  { day: 'Mon', avgTemp: 28, highTemp: 33, lowTemp: 23, rainfall: 0, season: 'Kharif' },
  { day: 'Tue', avgTemp: 27, highTemp: 32, lowTemp: 22, rainfall: 8, season: 'Kharif' },
  { day: 'Wed', avgTemp: 26, highTemp: 30, lowTemp: 21, rainfall: 15, season: 'Kharif' },
  { day: 'Thu', avgTemp: 25, highTemp: 29, lowTemp: 20, rainfall: 22, season: 'Kharif' },
  { day: 'Fri', avgTemp: 26, highTemp: 31, lowTemp: 21, rainfall: 10, season: 'Kharif' },
  { day: 'Sat', avgTemp: 28, highTemp: 34, lowTemp: 23, rainfall: 3, season: 'Kharif' },
  { day: 'Sun', avgTemp: 29, highTemp: 35, lowTemp: 24, rainfall: 1, season: 'Kharif' },
]

const DEFAULT_ALERTS = [
  { id: 'a1', alertType: 'Heavy Rain', region: 'Mumbai', severity: 'error', issued: '2026-06-03 06:00', status: 'Active' },
  { id: 'a2', alertType: 'Heatwave', region: 'Delhi', severity: 'warning', issued: '2026-06-02 22:00', status: 'Active' },
  { id: 'a3', alertType: 'Flood Warning', region: 'Chennai', severity: 'error', issued: '2026-06-03 12:00', status: 'Active' },
  { id: 'a4', alertType: 'Thunderstorm', region: 'Kolkata', severity: 'warning', issued: '2026-06-03 02:00', status: 'Active' },
  { id: 'a5', alertType: 'Drought Alert', region: 'Bangalore', severity: 'info', issued: '2026-06-01 08:00', status: 'Expired' },
  { id: 'a6', alertType: 'High Wind', region: 'Hyderabad', severity: 'warning', issued: '2026-06-03 04:00', status: 'Active' },
  { id: 'a7', alertType: 'Heatwave', region: 'Ahmedabad', severity: 'warning', issued: '2026-06-02 14:00', status: 'Active' },
  { id: 'a8', alertType: 'Heavy Rain', region: 'Guwahati', severity: 'error', issued: '2026-06-03 08:00', status: 'Active' },
  { id: 'a9', alertType: 'Fog Warning', region: 'Chandigarh', severity: 'info', issued: '2026-06-03 05:00', status: 'Expired' },
]

interface IndianCityWeather {
  region: string
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  condition: string
  sunlightHours: number
  season?: string
  seasonDesc?: string
}

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
  season?: string
}

function getConditionEmoji(condition: string): string {
  const map: Record<string, string> = {
    CLEAR: '\u2600\uFE0F',
    Sunny: '\u2600\uFE0F',
    Clear: '\u2600\uFE0F',
    CLOUDY: '\u26C5',
    Cloudy: '\u26C5',
    RAIN: '\uD83C\uDF27\uFE0F',
    Rainy: '\uD83C\uDF27\uFE0F',
    'Light Rain': '\uD83C\uDF26\uFE0F',
    Thunderstorms: '\u26C8\uFE0F',
    PARTLY_CLOUDY: '\u26C5',
    Showers: '\uD83C\uDF27\uFE0F',
    Rain: '\uD83C\uDF27\uFE0F',
    Snow: '\u2744\uFE0F',
    Foggy: '\uD83C\uDF2B\uFE0F',
    Windy: '\uD83C\uDF2C\uFE0F',
  }
  return map[condition] || '\u2600\uFE0F'
}

function formatCondition(condition: string): string {
  const map: Record<string, string> = {
    CLEAR: 'Clear',
    CLOUDY: 'Cloudy',
    RAIN: 'Rainy',
    PARTLY_CLOUDY: 'Partly Cloudy',
  }
  return map[condition] || condition
}

function getConditionColor(condition: string): string {
  if (['CLEAR', 'Sunny', 'Clear'].includes(condition)) return 'text-amber-400'
  if (['CLOUDY', 'Cloudy', 'PARTLY_CLOUDY'].includes(condition)) return 'text-slate-400'
  if (['RAIN', 'Rainy', 'Rain', 'Thunderstorms', 'Showers'].includes(condition)) return 'text-sky-400'
  return 'text-slate-300'
}

interface CreateWeatherPayload {
  region: string
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  sunlightHours: number
  condition: string
}

const INITIAL_CREATE_PAYLOAD: CreateWeatherPayload = {
  region: '',
  temperature: 25,
  humidity: 60,
  rainfall: 0,
  windSpeed: 10,
  sunlightHours: 8,
  condition: 'CLEAR',
}

const CONDITION_OPTIONS = [
  { value: 'CLEAR', label: 'Clear' },
  { value: 'CLOUDY', label: 'Cloudy' },
  { value: 'RAIN', label: 'Rainy' },
  { value: 'PARTLY_CLOUDY', label: 'Partly Cloudy' },
]

export default function WeatherPage() {
  const [currentWeather, setCurrentWeather] = useState<WeatherCurrent | null>(null)
  const [forecastData, setForecastData] = useState<WeatherForecastDay[] | null>(null)
  const [alertsData, setAlertsData] = useState<WeatherAlert[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [filterAlertStatus, setFilterAlertStatus] = useState<'all' | 'Active' | 'Expired'>('all')

  // Indian city weather state
  const [cityWeather, setCityWeather] = useState<IndianCityWeather[]>([])
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [cityFilter, setCityFilter] = useState<string>('')
  const [seasonFilter, setSeasonFilter] = useState<string>('')

  // Create weather record modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createPayload, setCreatePayload] = useState<CreateWeatherPayload>(INITIAL_CREATE_PAYLOAD)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setIsUsingFallback(false)

    try {
      const [currentRes, forecastRes, alertsRes] = await Promise.all([
        api.get('/weather'),
        api.get('/weather/forecast'),
        api.get('/weather/alerts'),
      ])

      const currentData = currentRes.data as Record<string, unknown>
      const bodyData = (currentData.data as Record<string, unknown>) ?? currentData
      setCurrentWeather({
        temperature: Number(bodyData.temperature ?? 25),
        feelsLike: Number(bodyData.feelsLike ?? bodyData.temperature ?? 23),
        humidity: Number(bodyData.humidity ?? 50),
        windSpeed: Number(bodyData.windSpeed ?? 10),
        condition: String(bodyData.condition ?? bodyData.weather ?? 'Clear'),
        location: String(bodyData.region ?? bodyData.location ?? 'Default'),
        timestamp: String(bodyData.recordedAt ?? bodyData.timestamp ?? new Date().toISOString()),
      })

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

  const fetchCityWeather = useCallback(async () => {
    setIsLoadingCities(true)
    const results: IndianCityWeather[] = []

    // Fetch in batches of 3 to avoid overwhelming the server
    const batchSize = 3
    for (let i = 0; i < INDIAN_CITIES.length; i += batchSize) {
      const batch = INDIAN_CITIES.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(
        batch.map(async (city) => {
          const res = await api.get(`/weather?region=${encodeURIComponent(city)}`)
          const body = res.data as Record<string, unknown>
          const d = (body.data as Record<string, unknown>) ?? body
          const seasonInfo = SEASON_LABELS[city] ?? { season: 'General', desc: '' }
          return {
            region: city,
            temperature: Number(d.temperature ?? 25),
            humidity: Number(d.humidity ?? 50),
            rainfall: Number(d.rainfall ?? 0),
            windSpeed: Number(d.windSpeed ?? 10),
            condition: String(d.condition ?? 'CLEAR'),
            sunlightHours: Number(d.sunlightHours ?? 8),
            season: seasonInfo.season,
            seasonDesc: seasonInfo.desc,
          } as IndianCityWeather
        })
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      }
    }

    setCityWeather(results)
    setIsLoadingCities(false)
  }, [])

  // Fetch on mount
  useEffect(() => { fetchAll() }, [fetchAll])

  // Fetch city weather on mount
  useEffect(() => {
    if (!isLoading) {
      fetchCityWeather()
    }
  }, [isLoading, fetchCityWeather])

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([fetchAll(), fetchCityWeather()])
  }, [fetchAll, fetchCityWeather])

  const displayStat = (val: number | undefined | null, fallback: number): number =>
    val != null ? val : fallback

  const displayStr = (val: string | undefined | null, fallback: string): string =>
    val != null && val !== '' ? val : fallback

  // Derived stats from Indian city weather
  const cityTemps = cityWeather.map(c => c.temperature)
  const avgCityTemp = cityTemps.length > 0
    ? cityTemps.reduce((a, b) => a + b, 0) / cityTemps.length
    : 0
  const highestTempCity = cityTemps.length > 0
    ? cityWeather.reduce((a, b) => a.temperature > b.temperature ? a : b).region
    : '--'
  const totalRainfall = cityWeather.reduce((sum, c) => sum + c.rainfall, 0)
  const monitoredCities = cityWeather.length

  // Filter city weather
  const filteredCityWeather = cityWeather.filter(c => {
    if (cityFilter && cityFilter !== 'all' && c.region !== cityFilter) return false
    if (seasonFilter && seasonFilter !== 'all' && c.season !== seasonFilter) return false
    return true
  })

  // Get unique seasons
  const uniqueSeasons = Array.from(new Set(cityWeather.map(c => c.season).filter(Boolean)))

  const chartData = forecastData && forecastData.length > 0
    ? forecastData as unknown as Record<string, unknown>[]
    : temperatureTrendData as unknown as Record<string, unknown>[]

  const displayAlerts = alertsData && alertsData.length > 0 ? alertsData : DEFAULT_ALERTS

  const filteredAlerts = filterAlertStatus === 'all'
    ? displayAlerts
    : displayAlerts.filter(a => a.status === filterAlertStatus)

  const activeAlertCount = displayAlerts.filter(a => a.status === 'Active').length
  const avgTemp = displayStat(currentWeather?.temperature, 25)
  const lastUpdated = currentWeather?.timestamp
    ? `${Math.round((Date.now() - new Date(currentWeather.timestamp).getTime()) / 60000)} min ago`
    : '2 min ago'

  const handleCreateRecord = useCallback(async () => {
    setIsCreating(true)
    setCreateError(null)
    setCreateSuccess(null)

    try {
      await api.post('/weather', createPayload)
      setCreateSuccess(`Weather record created for ${createPayload.region}`)
      setCreatePayload(INITIAL_CREATE_PAYLOAD)
      // Refresh city weather after creating
      setTimeout(() => {
        setCreateModalOpen(false)
        setCreateSuccess(null)
        fetchCityWeather()
      }, 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create weather record'
      setCreateError(msg)
    } finally {
      setIsCreating(false)
    }
  }, [createPayload, fetchCityWeather])

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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Avg Temp (Indian Cities)"
          value={`${avgCityTemp.toFixed(1)}°C`}
          change={1.2}
          changeLabel="vs yesterday"
          trend="up"
          icon={<Thermometer className="w-6 h-6" />}
        />
        <StatCard
          title="Highest Temp City"
          value={highestTempCity}
          change={0}
          changeLabel={highestTempCity !== '--' ? `max ${Math.round(Math.max(...cityTemps, 0))}°C` : ''}
          trend="up"
          icon={<Sun className="w-6 h-6" />}
        />
        <StatCard
          title="Total Rainfall"
          value={`${totalRainfall.toFixed(1)} mm`}
          change={15}
          changeLabel="above normal"
          trend="up"
          icon={<Droplets className="w-6 h-6" />}
        />
        <StatCard
          title="Last Updated"
          value={lastUpdated}
          icon={<Clock className="w-6 h-6" />}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Globe className="w-4 h-4" />
          <span>Indian Cities Weather Dashboard &mdash; {INDIAN_CITIES.length} cities monitored</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshAll}
            loading={isLoadingCities}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Weather
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCreatePayload(INITIAL_CREATE_PAYLOAD)
              setCreateError(null)
              setCreateSuccess(null)
              setCreateModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Create Record
          </Button>
        </div>
      </div>

      {/* Temperature Trend + Indian Cities Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Temperature Trends (Kharif / Monsoon Season)</h3>
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
            <h3 className="card-title">Indian Cities Weather</h3>
            <CloudSun className="w-4 h-4 text-slate-500" />
          </div>

          {/* Filters */}
          <div className="px-5 pb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <Select
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Cities' },
                  ...INDIAN_CITIES.map(c => ({ value: c, label: c })),
                ]}
                className="w-36 text-xs"
              />
            </div>
            {uniqueSeasons.length > 0 && (
              <Select
                value={seasonFilter}
                onChange={e => setSeasonFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Seasons' },
                  ...uniqueSeasons.map(s => ({ value: s ?? '', label: s ?? '' })),
                ]}
                className="w-40 text-xs"
              />
            )}
            {isLoadingCities && (
              <Loader2 className="w-3.5 h-3.5 text-admin-400 animate-spin" />
            )}
          </div>

          <DataTable
            columns={[
              {
                key: 'region',
                header: 'City',
                sortable: true,
                width: '110px',
                render: r => (
                  <span className="font-medium text-slate-200">{r.region as string}</span>
                ),
              },
              {
                key: 'temperature',
                header: 'Temp',
                sortable: true,
                width: '65px',
                render: r => <span>{r.temperature as number}°C</span>,
              },
              {
                key: 'humidity',
                header: 'Humidity',
                sortable: true,
                width: '80px',
                render: r => (
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    <span>{r.humidity as number}%</span>
                  </div>
                ),
              },
              {
                key: 'rainfall',
                header: 'Rainfall',
                sortable: true,
                width: '75px',
                render: r => (
                  <span className="text-blue-300">{(r.rainfall as number).toFixed(1)} mm</span>
                ),
              },
              {
                key: 'windSpeed',
                header: 'Wind',
                sortable: true,
                width: '70px',
                render: r => (
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-slate-400" />
                    <span>{r.windSpeed as number}</span>
                  </div>
                ),
              },
              {
                key: 'condition',
                header: 'Condition',
                sortable: true,
                width: '100px',
                render: r => {
                  const cond = r.condition as string
                  return (
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">{getConditionEmoji(cond)}</span>
                      <span className={getConditionColor(cond)}>{formatCondition(cond)}</span>
                    </span>
                  )
                },
              },
              {
                key: 'sunlightHours',
                header: 'Sunlight',
                sortable: true,
                width: '80px',
                render: r => (
                  <span className="text-amber-300">{(r.sunlightHours as number).toFixed(1)}h</span>
                ),
              },
              {
                key: 'season',
                header: 'Season',
                sortable: true,
                width: '130px',
                render: r => {
                  const s = r.season as string
                  return s ? (
                    <Badge variant="info" className="text-[10px]">
                      {s}
                    </Badge>
                  ) : null
                },
              },
            ]}
            data={filteredCityWeather as unknown as Record<string, unknown>[]}
            keyExtractor={w => String(w.region)}
            searchable
            searchPlaceholder="Search cities..."
            pageSize={9}
          />
        </div>
      </div>

      {/* Active Alerts */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Active Alerts — Indian Cities</h3>
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
            { key: 'region', header: 'City', sortable: true },
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

      {/* Create Weather Record Modal */}
      <Modal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open) {
            setCreateError(null)
            setCreateSuccess(null)
          }
        }}
        title="Create Weather Record"
        description="Manually set weather data for an Indian city"
      >
        <div className="space-y-4">
          <Select
            label="City"
            id="create-region"
            value={createPayload.region}
            onChange={e => setCreatePayload(p => ({ ...p, region: e.target.value }))}
            options={[
              { value: '', label: 'Select a city...' },
              ...INDIAN_CITIES.map(c => ({ value: c, label: c })),
            ]}
            placeholder="Select a city..."
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Temperature (°C)"
              id="create-temp"
              type="number"
              step="0.1"
              value={createPayload.temperature}
              onChange={e => setCreatePayload(p => ({ ...p, temperature: parseFloat(e.target.value) || 0 }))}
            />
            <Input
              label="Humidity (%)"
              id="create-humidity"
              type="number"
              step="1"
              min={0}
              max={100}
              value={createPayload.humidity}
              onChange={e => setCreatePayload(p => ({ ...p, humidity: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Rainfall (mm)"
              id="create-rainfall"
              type="number"
              step="0.1"
              value={createPayload.rainfall}
              onChange={e => setCreatePayload(p => ({ ...p, rainfall: parseFloat(e.target.value) || 0 }))}
            />
            <Input
              label="Wind Speed (km/h)"
              id="create-wind"
              type="number"
              step="1"
              value={createPayload.windSpeed}
              onChange={e => setCreatePayload(p => ({ ...p, windSpeed: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sunlight Hours"
              id="create-sunlight"
              type="number"
              step="0.5"
              min={0}
              max={24}
              value={createPayload.sunlightHours}
              onChange={e => setCreatePayload(p => ({ ...p, sunlightHours: parseFloat(e.target.value) || 0 }))}
            />
            <Select
              label="Condition"
              id="create-condition"
              value={createPayload.condition}
              onChange={e => setCreatePayload(p => ({ ...p, condition: e.target.value }))}
              options={CONDITION_OPTIONS}
            />
          </div>

          {createError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{createError}</p>
            </div>
          )}

          {createSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
              <p className="text-sm text-emerald-300">{createSuccess}</p>
            </div>
          )}

          <ModalFooter>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRecord}
              loading={isCreating}
              disabled={!createPayload.region}
            >
              Create Record
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
