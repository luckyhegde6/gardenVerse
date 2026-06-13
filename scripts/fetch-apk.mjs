// Fetch the latest APK from EAS and place it in public/downloads/
// This runs during `vercel-build` to include the APK in the Vercel deployment
// The APK is served as a static asset by Vercel's CDN (no serverless limit)

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const apkDir = join(projectRoot, 'packages', 'admin', 'public', 'downloads')
const apkPath = join(apkDir, 'gardenverse-latest.apk')

const EXPO_TOKEN = process.env.EXPO_TOKEN
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID

async function fetchApk() {
  // If APK already exists and is real (>1MB), skip
  try { const fs = await import('fs')
    const stat = fs.statSync(apkPath)
    if (stat.size > 1_000_000) {
      console.log(`APK already exists (${(stat.size / 1024 / 1024).toFixed(1)} MB). Skipping download.`)
      return
    }
  } catch {}

  if (!EXPO_TOKEN || !EAS_PROJECT_ID) {
    console.log('EXPO_TOKEN or EAS_PROJECT_ID not set. APK will not be fetched.')
    console.log('The download page will show a "not available" message.')
    return
  }

  console.log('Fetching latest APK from EAS...')

  try {
    // Get latest build
    const buildsUrl = `https://api.expo.dev/v2/projects/${EAS_PROJECT_ID}/builds?limit=1&platform=android`
    const buildsRes = await fetch(buildsUrl, {
      headers: { 'Authorization': `Bearer ${EXPO_TOKEN}` },
    })

    if (!buildsRes.ok) {
      console.log(`Failed to fetch builds: ${buildsRes.status}`)
      return
    }

    const buildsJson = await buildsRes.json()
    const builds = buildsJson.data || buildsJson
    const latestBuild = Array.isArray(builds) ? builds[0] : builds

    if (!latestBuild) {
      console.log('No builds found.')
      return
    }

    const artifactUrl = latestBuild.android?.artifactUrl
    if (!artifactUrl) {
      console.log(`Latest build (${latestBuild.id}) has no artifact URL. Status: ${latestBuild.status}`)
      return
    }

    console.log(`Downloading APK from build ${latestBuild.id}...`)
    console.log(`URL: ${artifactUrl}`)

    const apkRes = await fetch(artifactUrl)
    if (!apkRes.ok) {
      console.log(`Failed to download APK: ${apkRes.status}`)
      return
    }

    const apkBuffer = Buffer.from(await apkRes.arrayBuffer())

    mkdirSync(apkDir, { recursive: true })
    writeFileSync(apkPath, apkBuffer)

    console.log(`APK saved: ${(apkBuffer.length / 1024 / 1024).toFixed(1)} MB`)
  } catch (err) {
    console.error('Error fetching APK:', err.message)
  }
}

fetchApk()
