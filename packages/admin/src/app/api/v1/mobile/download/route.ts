import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Redirect to GitHub Releases asset (no file size limit)
  // Update this URL when a new APK is released
  const apkUrl = process.env.APK_DOWNLOAD_URL ||
    'https://github.com/luckyhegde6/gardenVerse/releases/download/v1.0.0/app-debug.apk'

  return NextResponse.redirect(apkUrl, 307)
}
