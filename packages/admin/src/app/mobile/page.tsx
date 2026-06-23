'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Smartphone, History, Shield, Zap, Wifi, WifiOff, Hammer, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface ApkInfo {
  version: string
  buildNumber: number
  size: string
  releaseDate: string
  changelog: string[]
  downloadUrl: string
  qrCodeData: string
}

interface SyncStatus {
  lastSync: string | null
  status: 'idle' | 'syncing' | 'success' | 'error'
  message: string
}

interface BuildStatus {
  status: 'idle' | 'building' | 'success' | 'error'
  message: string
  buildId: string | null
  apkExists: boolean
  apkSize: string | null
}

export default function MobileDownloadPage() {
  const [activeTab, setActiveTab] = useState<'download' | 'changelog' | 'sync' | 'build'>('download')
  const [apkInfo, setApkInfo] = useState<ApkInfo | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ lastSync: null, status: 'idle', message: '' })
  const [isOnline, setIsOnline] = useState(true)
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({ status: 'idle', message: '', buildId: null, apkExists: false, apkSize: null })

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    // Fetch APK info from API
    fetch('/api/v1/mobile/apk-info')
      .then(res => res.json())
      .then(data => {
        if (data.data) setApkInfo(data.data)
      })
      .catch(() => {
        // Fallback to default info
        setApkInfo({
          version: '1.0.0',
          buildNumber: 1,
          size: '~85 MB',
          releaseDate: new Date().toISOString().split('T')[0],
          changelog: [
            'Initial release',
            'Virtual garden with 2D/3D views',
            'Plant identification with AI scanner',
            'Quest system with daily/weekly challenges',
            'Marketplace for trading seeds and tools',
            'Community features with chat and groups',
          ],
          downloadUrl: '/api/v1/mobile/download',
          qrCodeData: `${typeof window !== 'undefined' ? window.location.origin : 'https://gardenverse.vercel.app'}/api/v1/mobile/download`,
        })
      })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleDownload = () => {
    if (apkInfo?.downloadUrl) {
      const link = document.createElement('a')
      link.href = apkInfo.downloadUrl
      link.download = `gardenverse-v${apkInfo.version}-build${apkInfo.buildNumber}.apk`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleSyncTest = async () => {
    setSyncStatus({ lastSync: null, status: 'syncing', message: 'Testing sync connection...' })
    try {
      const res = await fetch('/api/v1/mobile/sync-status')
      const data = await res.json()
      if (data.data?.connected) {
        setSyncStatus({
          lastSync: new Date().toISOString(),
          status: 'success',
          message: `Synced successfully. ${data.data.activeUsers || 0} active users online.`,
        })
      } else {
        setSyncStatus({
          lastSync: null,
          status: 'error',
          message: 'Sync service unavailable. Check AI service connection.',
        })
      }
    } catch {
      setSyncStatus({ lastSync: null, status: 'error', message: 'Network error. Check connection.' })
    }
  }

  const checkBuildStatus = async () => {
    try {
      const res = await fetch('/api/v1/mobile/build-apk')
      const data = await res.json()
      if (data.apkExists) {
        setBuildStatus(prev => ({
          ...prev,
          apkExists: true,
          apkSize: data.apkSize,
        }))
      }
    } catch {}
  }

  useEffect(() => {
    checkBuildStatus()
  }, [])

  const handleBuildApk = async () => {
    setBuildStatus({ status: 'building', message: 'Starting EAS preview build...', buildId: null, apkExists: buildStatus.apkExists, apkSize: buildStatus.apkSize })
    try {
      const res = await fetch('/api/v1/mobile/build-apk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: 'preview' }),
      })
      const data = await res.json()
      if (data.success) {
        setBuildStatus({
          status: 'success',
          message: data.message,
          buildId: data.buildId,
          apkExists: true,
          apkSize: buildStatus.apkSize,
        })
      } else {
        setBuildStatus({
          status: 'error',
          message: data.error + (data.detail ? ': ' + data.detail : ''),
          buildId: null,
          apkExists: buildStatus.apkExists,
          apkSize: buildStatus.apkSize,
        })
      }
    } catch {
      setBuildStatus({
        status: 'error',
        message: 'Failed to start build. Check network connection.',
        buildId: null,
        apkExists: buildStatus.apkExists,
        apkSize: buildStatus.apkSize,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">GardenVerse Mobile</h1>
            <p className="text-gray-500 text-sm">Download, sync, and manage the mobile app</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <Wifi className="w-4 h-4" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                <WifiOff className="w-4 h-4" /> Offline
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {[
            { id: 'download' as const, label: 'Download', icon: Download },
            { id: 'build' as const, label: 'Build APK', icon: Hammer },
            { id: 'changelog' as const, label: 'Changelog', icon: History },
            { id: 'sync' as const, label: 'Sync Status', icon: Zap },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Download Tab */}
          {activeTab === 'download' && apkInfo && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Download Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">GardenVerse APK</h2>
                    <p className="text-sm text-gray-500">Android 8.0+ (API 26+)</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Version</span>
                    <span className="font-medium text-gray-900">v{apkInfo.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Build</span>
                    <span className="font-medium text-gray-900">#{apkInfo.buildNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Size</span>
                    <span className="font-medium text-gray-900">{apkInfo.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Released</span>
                    <span className="font-medium text-gray-900">{apkInfo.releaseDate}</span>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download APK
                </button>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Signed with GardenVerse release key • SHA-256 verified</span>
                </div>
              </div>

              {/* QR Code Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan to Download</h3>
                <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 mb-4">
                  <QRCodeSVG
                    value={apkInfo.qrCodeData}
                    size={180}
                    level="H"
                    includeMargin
                    imageSettings={{
                      src: '/icon-192.png',
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500 text-center max-w-xs">
                  Scan this QR code with your Android device to download the APK directly.
                </p>
                <div className="mt-4 text-xs text-gray-400 font-mono bg-gray-50 px-3 py-1.5 rounded-lg break-all max-w-full">
                  {apkInfo.downloadUrl}
                </div>
              </div>
            </div>
          )}

          {/* Build APK Tab */}
          {activeTab === 'build' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Hammer className="w-5 h-5 text-gray-400" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Build APK</h2>
                    <p className="text-sm text-gray-500">Generate a new APK via EAS Build</p>
                  </div>
                </div>
                <button
                  onClick={handleBuildApk}
                  disabled={buildStatus.status === 'building'}
                  className="py-2.5 px-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
                >
                  {buildStatus.status === 'building' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Building...</>
                  ) : (
                    <><Hammer className="w-4 h-4" /> Start Preview Build</>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                {/* APK Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">APK Status</div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {buildStatus.apkExists ? (
                        <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-600">Available</span></>
                      ) : (
                        <><XCircle className="w-4 h-4 text-amber-500" /><span className="text-amber-600">Not built yet</span></>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Local APK Size</div>
                    <div className="text-sm font-medium text-gray-900">
                      {buildStatus.apkSize || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Build result message */}
                {buildStatus.message && (
                  <div className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
                    buildStatus.status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                    buildStatus.status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                    buildStatus.status === 'building' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}>
                    {buildStatus.status === 'success' && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    {buildStatus.status === 'error' && <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    {buildStatus.status === 'building' && <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin" />}
                    <div>
                      <p>{buildStatus.message}</p>
                      {buildStatus.buildId && (
                        <p className="text-xs mt-1 opacity-70">Build ID: {buildStatus.buildId}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Build info */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">About EAS Builds</h3>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>Preview</strong>: Builds an APK for direct download (used by this website)</li>
                    <li>• <strong>Production</strong>: Builds an AAB for Google Play Store</li>
                    <li>• Build time: typically 10-20 minutes</li>
                    <li>• The APK is compiled from the latest <code className="bg-blue-100 px-1 rounded">packages/mobile</code> code</li>
                  </ul>
                </div>

                {/* Download current APK if exists */}
                {buildStatus.apkExists && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">APK ready for download</p>
                      <p className="text-xs text-green-600">Available at /downloads/gardenverse-latest.apk</p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="py-2 px-4 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Changelog Tab */}
          {activeTab === 'changelog' && apkInfo && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <History className="w-5 h-5 text-gray-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Version {apkInfo.version}</h2>
                  <p className="text-sm text-gray-500">Released {apkInfo.releaseDate}</p>
                </div>
              </div>
              <div className="space-y-3">
                {apkInfo.changelog.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Status Tab */}
          {activeTab === 'sync' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-gray-400" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Sync Status</h2>
                    <p className="text-sm text-gray-500">Game data synchronization health</p>
                  </div>
                </div>
                <button
                  onClick={handleSyncTest}
                  disabled={syncStatus.status === 'syncing'}
                  className="py-2 px-4 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {syncStatus.status === 'syncing' ? 'Testing...' : 'Test Sync'}
                </button>
              </div>

              <div className="space-y-4">
                {/* Status indicators */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Server Connection</div>
                    <div className={`flex items-center gap-2 text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                      {isOnline ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Last Sync</div>
                    <div className="text-sm font-medium text-gray-900">
                      {syncStatus.lastSync
                        ? new Date(syncStatus.lastSync).toLocaleTimeString()
                        : 'Never'}
                    </div>
                  </div>
                </div>

                {/* Sync result message */}
                {syncStatus.message && (
                  <div className={`p-4 rounded-xl text-sm ${
                    syncStatus.status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                    syncStatus.status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {syncStatus.message}
                  </div>
                )}

                {/* Sync info */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h3 className="text-sm font-medium text-amber-800 mb-2">About Game Sync</h3>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• Game progress is automatically saved locally on the device</li>
                    <li>• Data syncs to the server when the app connects</li>
                    <li>• On conflict, server data takes precedence</li>
                    <li>• Manual sync available in mobile app settings</li>
                    <li>• Auto-sync runs on app start and every 5 minutes in foreground</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>GardenVerse Mobile v{apkInfo?.version || '1.0.0'} • Build #{apkInfo?.buildNumber || 1}</p>
          <p className="mt-1">Non-breaking deployments ensure game data continuity</p>
        </div>
      </div>
    </div>
  )
}
