import { NextRequest, NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com'
const OWNER = 'luckyhegde6'
const REPO = 'gardenVerse'

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      return NextResponse.json({
        apkExists: false,
        apkSize: null,
        builds: [],
      })
    }

    const res = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/runs?branch=main&event=workflow_dispatch&per_page=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({
        apkExists: false,
        apkSize: null,
        builds: [],
        error: `GitHub API error: ${res.status}`,
      })
    }

    const data = await res.json()
    const builds = (data.workflow_runs || []).map((run: any) => ({
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      htmlUrl: run.html_url,
    }))

    return NextResponse.json({ builds, apkExists: false, apkSize: null })
  } catch (error) {
    return NextResponse.json(
      { apkExists: false, apkSize: null, builds: [], error: 'Failed to fetch build status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub token not configured',
          detail: 'Set GITHUB_TOKEN env var to enable remote builds',
        },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const profile = body.profile || 'preview'

    const res = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/workflows/mobile.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            profile,
            platform: 'android',
          },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        {
          success: false,
          error: `GitHub API error: ${res.status}`,
          detail: errText,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `EAS ${profile} build triggered. Check the Actions tab for progress.`,
      profile,
      platform: 'android',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger build',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
