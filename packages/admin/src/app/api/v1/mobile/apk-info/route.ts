import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const version = process.env.APK_VERSION || '1.0.0'
  const buildNumber = parseInt(process.env.APK_BUILD_NUMBER || '1', 10)
  const envSizeMB = process.env.APK_SIZE_MB
  const releaseDate = process.env.APK_RELEASE_DATE || new Date().toISOString().split('T')[0]

  // Try to get actual file size from local APK
  let size: string
  try {
    const apkPath = path.join(process.cwd(), 'public', 'downloads', 'gardenverse-latest.apk')
    if (fs.existsSync(apkPath)) {
      const fileSize = fs.statSync(apkPath).size
      size = `${(fileSize / 1024 / 1024).toFixed(1)} MB`
    } else {
      size = envSizeMB ? `${envSizeMB} MB` : 'N/A'
    }
  } catch {
    size = envSizeMB ? `${envSizeMB} MB` : 'N/A'
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gardenverse.vercel.app'

  return NextResponse.json({
    data: {
      version,
      buildNumber,
      size,
      releaseDate,
      changelog,
      downloadUrl: '/api/v1/mobile/download',
      qrCodeData: `${siteUrl}/download`,
      minAndroidVersion: '8.0 (API 26)',
      supportedArchitectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    },
  })
}
