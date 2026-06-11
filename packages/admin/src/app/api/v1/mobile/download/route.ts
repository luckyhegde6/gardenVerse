import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  const downloadsDir = join(process.cwd(), 'public', 'downloads')
  const apkPath = join(downloadsDir, 'gardenverse-latest.apk')

  if (!existsSync(apkPath)) {
    return NextResponse.json(
      { error: 'APK not available. Please build the app first or contact support.' },
      { status: 404 }
    )
  }

  try {
    const stat = statSync(apkPath)
    const fileBuffer = readFileSync(apkPath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="gardenverse-latest.apk"',
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to read APK file.' },
      { status: 500 }
    )
  }
}
