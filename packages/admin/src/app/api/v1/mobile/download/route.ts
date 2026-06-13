import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Serve APK from static public/downloads/ folder
  // Files in public/ are served by Vercel's CDN (not serverless), so no 50MB limit
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gardenverse.vercel.app'
  const apkUrl = `${baseUrl}/downloads/gardenverse-latest.apk`

  return NextResponse.redirect(apkUrl, 307)
}
