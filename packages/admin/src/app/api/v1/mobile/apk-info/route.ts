import { NextResponse } from 'next/server'
import { readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const downloadsDir = join(process.cwd(), 'public', 'downloads')

  let version = '1.0.0'
  let buildNumber = 1
  let size = 'N/A'
  let releaseDate = new Date().toISOString().split('T')[0]

  // Check if APK exists in public/downloads
  if (existsSync(downloadsDir)) {
    try {
      const files = readdirSync(downloadsDir).filter(f => f.endsWith('.apk'))
      if (files.length > 0) {
        // Get the latest APK file
        const latestApk = files
          .map(f => ({ name: f, stat: statSync(join(downloadsDir, f)) }))
          .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())[0]

        if (latestApk) {
          const fileSizeMB = latestApk.stat.size / (1024 * 1024)
          size = `${Math.round(fileSizeMB)} MB`
          releaseDate = latestApk.stat.mtime.toISOString().split('T')[0]

          // Try to extract version from filename (e.g., gardenverse-v1.2.3-build45.apk)
          const versionMatch = latestApk.name.match(/v(\d+\.\d+\.\d+)/)
          const buildMatch = latestApk.name.match(/build(\d+)/)
          if (versionMatch) version = versionMatch[1]
          if (buildMatch) buildNumber = parseInt(buildMatch[1], 10)
        }
      }
    } catch {
      // Directory read failed, use defaults
    }
  }

  const changelog = [
    'Virtual garden with 2D/3D isometric views',
    'Plant identification with AI scanner',
    'Quest system: daily, weekly, and seasonal challenges',
    'Marketplace for trading seeds, tools, and produce',
    'Community features: groups, chat, garden visits',
    'Game save & sync: auto-save progress, sync across devices',
    'Plant photo quests: identify and capture plants for AI training',
    'Enhanced garden visualization with growth animations',
    'Gardening tools: water, fertilize, harvest with visual feedback',
    'Offline support with background sync when online',
  ]

  return NextResponse.json({
    data: {
      version,
      buildNumber,
      size,
      releaseDate,
      changelog,
      downloadUrl: '/api/v1/mobile/download',
      qrCodeData: `https://gardenverse.vercel.app/api/v1/mobile/download`,
      minAndroidVersion: '8.0 (API 26)',
      supportedArchitectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    },
  })
}
