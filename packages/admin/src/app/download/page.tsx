'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Smartphone, History, Shield, Sprout } from 'lucide-react'

interface ApkInfo {
  version: string
  buildNumber: number
  size: string
  releaseDate: string
  changelog: string[]
  downloadUrl: string
  qrCodeData: string
  minAndroidVersion: string
  supportedArchitectures: string[]
}

export default function DownloadPage() {
  const [apkInfo, setApkInfo] = useState<ApkInfo | null>(null)

  useEffect(() => {
    fetch('/api/v1/mobile/apk-info')
      .then(res => res.json())
      .then(data => {
        if (data.data) setApkInfo(data.data)
      })
      .catch(() => {
        setApkInfo({
          version: '1.0.0',
          buildNumber: 1,
          size: 'N/A',
          releaseDate: new Date().toISOString().split('T')[0],
          changelog: ['Initial release'],
          downloadUrl: '/api/v1/mobile/download',
          qrCodeData: `${window.location.origin}/download`,
          minAndroidVersion: '8.0 (API 26)',
          supportedArchitectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
        })
      })
  }, [])

  const handleDownload = () => {
    if (apkInfo?.downloadUrl) {
      window.location.href = apkInfo.downloadUrl
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-6">
          <Sprout className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          GardenVerse
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          Grow your virtual garden, identify plants with AI, and connect with a community of gardeners.
        </p>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-3 py-4 px-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-semibold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Download className="w-6 h-6" />
          Download for Android
        </button>
        {apkInfo && (
          <p className="mt-3 text-sm text-gray-500">
            v{apkInfo.version} (Build #{apkInfo.buildNumber}) &middot; {apkInfo.size}
          </p>
        )}
      </div>

      {/* Info Cards */}
      {apkInfo && (
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                App Details
              </h2>
              <div className="space-y-3">
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Min Android</span>
                  <span className="font-medium text-gray-900">{apkInfo.minAndroidVersion}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Signed with GardenVerse release key</span>
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
                />
              </div>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Scan this QR code with your Android device to open this page and download.
              </p>
            </div>
          </div>

          {/* Changelog */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              What&apos;s New in v{apkInfo.version}
            </h2>
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

          {/* System Requirements */}
          <div className="mt-6 bg-amber-50 rounded-2xl border border-amber-200 p-6">
            <h3 className="text-sm font-medium text-amber-800 mb-2">System Requirements</h3>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>Android 8.0 (API level 26) or higher</li>
              <li>Supported architectures: {apkInfo.supportedArchitectures.join(', ')}</li>
              <li>Camera access required for plant scanning</li>
              <li>Location access recommended for weather features</li>
              <li>Internet connection required for sync and community features</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
