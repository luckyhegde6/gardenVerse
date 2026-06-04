'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Users, Trees, Loader2, AlertCircle, Navigation, Globe } from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DataTable } from '@/components/DataTable'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs'
import api from '@/lib/api'

interface GardenLocation {
  id: string
  name: string
  owner: string
  type: string
  address: string | null
  latitude: number | null
  longitude: number | null
  region: string
  crops: number
  soilQuality: number
}

interface NearbyGardener {
  id: string
  username: string
  displayName: string
  region: string | null
  geohash: string | null
  gardens: number
}

const CITY_MAP: Record<string, string> = {
  'IN-KA': 'Bangalore',
  'IN-MH': 'Mumbai / Pune',
  'IN-DL': 'Delhi',
  'IN-TS': 'Hyderabad',
  'IN-TN': 'Chennai',
  'IN-WB': 'Kolkata',
  'IN-GJ': 'Ahmedabad',
}

export default function LocationsPage() {
  const [tab, setTab] = useState('map')
  const [gardens, setGardens] = useState<GardenLocation[]>([])
  const [gardeners, setGardeners] = useState<NearbyGardener[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGarden, setSelectedGarden] = useState<GardenLocation | null>(null)

  const gardensWithCoords = gardens.filter(g => g.latitude != null && g.longitude != null)

  const groupedByRegion: Record<string, GardenLocation[]> = {}
  for (const g of gardens) {
    const key = g.region || 'Unknown'
    if (!groupedByRegion[key]) groupedByRegion[key] = []
    groupedByRegion[key].push(g)
  }

  const gardenMarkers = gardensWithCoords.map(g =>
    `&marker=${g.latitude}%2C${g.longitude}`
  ).join('')

  const fullMapUrl = gardensWithCoords.length > 0
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(...gardensWithCoords.map(g => g.longitude!)) - 0.5}%2C${Math.min(...gardensWithCoords.map(g => g.latitude!)) - 0.5}%2C${Math.max(...gardensWithCoords.map(g => g.longitude!)) + 0.5}%2C${Math.max(...gardensWithCoords.map(g => g.latitude!)) + 0.5}&layer=mapnik${gardenMarkers}`
    : 'https://www.openstreetmap.org/export/embed.html?bbox=68.0%2C8.0%2C98.0%2C37.0&layer=mapnik'

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [gardensRes, usersRes] = await Promise.all([
        api.get('/gardens', { params: { limit: 50 } }),
        api.get('/users', { params: { limit: 50 } }),
      ])

      const gardensBody = gardensRes.data as { data?: Record<string, unknown>[] }
      if (gardensBody?.data) {
        setGardens(gardensBody.data.map((g: Record<string, unknown>) => ({
          id: g.id as string,
          name: g.name as string,
          owner: ((g.user as Record<string, unknown>)?.displayName as string) ?? ((g.user as Record<string, unknown>)?.username as string) ?? 'Unknown',
          type: g.type as string,
          address: g.address as string | null,
          latitude: g.latitude as number | null,
          longitude: g.longitude as number | null,
          region: ((g.user as Record<string, unknown>)?.region as string) ?? '',
          crops: (g.crops as unknown[])?.length ?? 0,
          soilQuality: (g.soilQuality as number) ?? 0,
        })))
      }

      const usersBody = usersRes.data as { data?: Record<string, unknown>[] }
      if (usersBody?.data) {
        setGardeners(usersBody.data.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          username: u.username as string,
          displayName: u.displayName as string,
          region: u.region as string | null,
          geohash: u.geohash as string | null,
          gardens: (u._count as Record<string, number>)?.gardens ?? 0,
        })))
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? `Failed to load location data: ${(err as { response: { status: number } }).response?.status ?? 'Unknown error'}`
          : 'Failed to load location data.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (isLoading && gardens.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-admin-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading location data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Garden Locations</h1>
          <p className="text-sm text-slate-400 mt-1">
            {gardensWithCoords.length} gardens mapped across {Object.keys(groupedByRegion).length} regions
          </p>
        </div>
        <Badge variant="info" className="text-sm px-3 py-1">
          <MapPin className="w-4 h-4 mr-1" />
          {gardensWithCoords.length} / {gardens.length} with coordinates
        </Badge>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData}>Retry</Button>
        </div>
      )}

      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="map">
            <MapPin className="w-4 h-4 mr-1.5" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="gardeners">
            <Users className="w-4 h-4 mr-1.5" />
            All Gardeners ({gardeners.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <div className="card p-0 overflow-hidden">
                <iframe
                  title="Garden Locations Map"
                  width="100%"
                  height="500"
                  frameBorder="0"
                  scrolling="no"
                  src={fullMapUrl}
                  className="rounded-lg"
                  style={{ border: 0 }}
                />
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {Object.entries(groupedByRegion).map(([region, regionGardens]) => (
                <div key={region} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-admin-400" />
                      {CITY_MAP[region] || region}
                    </h3>
                    <Badge variant="info">{regionGardens.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {regionGardens.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGarden(selectedGarden?.id === g.id ? null : g)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedGarden?.id === g.id
                            ? 'bg-admin-500/10 border border-admin-500/30'
                            : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-200">{g.name}</span>
                          <Badge variant={g.type === 'HYBRID' ? 'info' : g.type === 'REAL' ? 'active' : 'default'}>{g.type}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{g.owner}</p>
                        {g.address && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{g.address}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span><Trees className="w-3 h-3 inline mr-0.5" />{g.crops} crops</span>
                          <span>Soil: {g.soilQuality}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedGarden && selectedGarden.latitude && selectedGarden.longitude && (
            <div className="card mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-100">{selectedGarden.name}</h3>
                <a
                  href={`https://www.google.com/maps?q=${selectedGarden.latitude},${selectedGarden.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-admin-400 hover:text-admin-300 flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Open in Maps
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Owner</span>
                  <p className="text-slate-200">{selectedGarden.owner}</p>
                </div>
                <div>
                  <span className="text-slate-500">Type</span>
                  <p className="text-slate-200">{selectedGarden.type}</p>
                </div>
                <div>
                  <span className="text-slate-500">Crops</span>
                  <p className="text-slate-200">{selectedGarden.crops}</p>
                </div>
                <div>
                  <span className="text-slate-500">Soil Quality</span>
                  <p className="text-slate-200">{selectedGarden.soilQuality}%</p>
                </div>
              </div>
              {selectedGarden.address && (
                <p className="text-sm text-slate-400 mt-2">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {selectedGarden.address}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {selectedGarden.latitude.toFixed(4)}, {selectedGarden.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gardeners">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">All Gardeners</h3>
              <Badge variant="info">{gardeners.length}</Badge>
            </div>
            {gardeners.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'displayName', header: 'Name', sortable: true },
                  { key: 'username', header: 'Username', sortable: true },
                  { key: 'region', header: 'Region', sortable: true, width: '120px', render: r => {
                    const region = r.region as string | null
                    return region ? (
                      <Badge variant="default">{CITY_MAP[region] || region}</Badge>
                    ) : (
                      <span className="text-slate-500">&mdash;</span>
                    )
                  }},
                  { key: 'gardens', header: 'Gardens', sortable: true, width: '90px' },
                  { key: 'geohash', header: 'Geohash', sortable: true, width: '100px', render: r => {
                    const gh = r.geohash as string | null
                    return gh ? (
                      <span className="text-xs font-mono text-slate-400">{gh}</span>
                    ) : (
                      <span className="text-slate-500">&mdash;</span>
                    )
                  }},
                ]}
                data={gardeners as unknown as Record<string, unknown>[]}
                keyExtractor={(r) => (r as unknown as NearbyGardener).id}
                pageSize={10}
              />
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No gardeners found.
              </div>
            )}
          </div>
        </TabsContent>
      </TabsRoot>
    </div>
  )
}
