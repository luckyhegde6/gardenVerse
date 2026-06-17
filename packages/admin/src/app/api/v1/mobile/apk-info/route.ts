import { NextResponse } from 'next/server'

export async function GET() {
  const version = process.env.APK_VERSION || '1.0.0'
  const buildNumber = parseInt(process.env.APK_BUILD_NUMBER || '1', 10)
  const sizeMB = process.env.APK_SIZE_MB || '183'
  const releaseDate = process.env.APK_RELEASE_DATE || '2026-06-15'
  const size = `${sizeMB} MB`

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
