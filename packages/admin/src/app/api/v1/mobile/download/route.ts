import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  // Try local APK first (downloaded via CI or fetch-apk.mjs)
  const localApkPath = join(process.cwd(), 'public', 'downloads', 'gardenverse-latest.apk')

  if (existsSync(localApkPath)) {
    const stat = statSync(localApkPath)
    if (stat.size > 1_000_000) {
      const apk = readFileSync(localApkPath)
      return new NextResponse(apk, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': 'attachment; filename="gardenverse-latest.apk"',
          'Content-Length': stat.size.toString(),
        },
      })
    }
  }

  // Fallback: redirect to EAS artifact or GitHub Releases
  const apkUrl = process.env.APK_DOWNLOAD_URL ||
    'https://github.com/luckyhegde6/gardenVerse/releases/download/v1.0.0/app-debug.apk'

  return NextResponse.redirect(apkUrl, 307)
}
