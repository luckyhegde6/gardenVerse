'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Smartphone, Shield } from 'lucide-react'

interface ApkInfo {
  version: string
  buildNumber: number
  size: string
  releaseDate: string
  downloadUrl: string
  qrCodeData: string
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
          size: '~85 MB',
          releaseDate: new Date().toISOString().split('T')[0],
          downloadUrl: '/api/v1/mobile/download',
          qrCodeData: `${typeof window !== 'undefined' ? window.location.origin : 'https://gardenverse.vercel.app'}/api/v1/mobile/download`,
        })
      })
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">GardenVerse</h1>
          <p className="text-gray-500 text-sm mt-1">Download the mobile app</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          {/* Version info */}
          {apkInfo && (
            <div className="flex justify-center gap-6 mb-6 text-sm">
              <span className="text-gray-500">v{apkInfo.version}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">{apkInfo.size}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Android 8.0+</span>
            </div>
          )}

          {/* QR Code */}
          {apkInfo && (
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100">
                <QRCodeSVG
                  value={apkInfo.qrCodeData}
                  size={200}
                  level="H"
                  includeMargin
                  imageSettings={{
                    src: '/icon-192.png',
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 text-center mb-6">
            Scan the QR code with your Android device to download the APK directly.
          </p>

          <button
            onClick={handleDownload}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download APK
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Signed with GardenVerse release key</span>
          </div>
        </div>

        {/* Fallback link */}
        {apkInfo && (
          <div className="text-center text-xs text-gray-400 font-mono break-all px-4">
            {apkInfo.downloadUrl}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>GardenVerse Mobile v{apkInfo?.version || '1.0.0'}</p>
        </div>
      </div>
    </div>
  )
}
