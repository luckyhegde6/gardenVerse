// Fetch the latest APK from EAS and place it in public/downloads/
// This runs during `vercel-build` to include the APK in the Vercel deployment
// The APK is served as a static asset by Vercel's CDN (no serverless limit)

import { writeFileSync, mkdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const apkDir = join(projectRoot, 'packages', 'admin', 'public', 'downloads')
const apkPath = join(apkDir, 'gardenverse-latest.apk')

const EXPO_TOKEN = process.env.EXPO_TOKEN
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { encoding: 'utf8', timeout: 30_000, ...opts }, (err, stdout, stderr) => {
      if (err) reject(stderr || err)
      else resolve(stdout)
    })
  })
}

async function fetchApk() {
  // If APK already exists and is real (>1MB), skip
  try {
    const stat = statSync(apkPath)
    if (stat.size > 1_000_000) {
      console.log(`APK already exists (${(stat.size / 1024 / 1024).toFixed(1)} MB). Skipping.`)
      return
    }
  } catch {}

  if (!EXPO_TOKEN || !EAS_PROJECT_ID) {
    console.log('EXPO_TOKEN or EAS_PROJECT_ID not set. APK will not be fetched.')
    return
  }

  console.log('Fetching latest APK from EAS...')

  // --- Strategy 1: EAS REST API ---
  try {
    const url = `https://api.expo.dev/v2/projects/${EAS_PROJECT_ID}/builds?limit=1&platform=android`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${EXPO_TOKEN}` } })

    if (res.ok) {
      const data = await res.json()
      const latest = (data.data || data)[0]
      if (latest?.android?.artifactUrl) {
        const apk = await fetch(latest.android.artifactUrl)
        if (apk.ok) {
          mkdirSync(apkDir, { recursive: true })
          writeFileSync(apkPath, Buffer.from(await apk.arrayBuffer()))
          console.log(`APK saved via REST API: ${(statSync(apkPath).size / 1024 / 1024).toFixed(1)} MB`)
          return
        }
      }
      console.log(`REST API: latest build has no artifact yet (status: ${latest?.status}).`)
    } else {
      console.log(`REST API returned ${res.status}: ${(await res.text()).slice(0, 200)}`)
    }
  } catch (err) {
    console.log(`REST API error: ${err.message}`)
  }

  // --- Strategy 2: EAS CLI (authenticated locally) ---
  try {
    const cwd = join(projectRoot, 'packages', 'mobile')
    const json = await runCmd('eas', ['build:list', '--json', '--limit', '1', '--platform', 'android', '--project', EAS_PROJECT_ID], { cwd })
    const builds = JSON.parse(json)
    const latest = Array.isArray(builds) ? builds[0] : builds
    const artifactUrl = latest?.android?.artifactUrl || latest?.artifacts?.buildUrl

    if (!artifactUrl) {
      console.log(`CLI: no artifact URL found. Build status: ${latest?.status || 'unknown'}`)
      return
    }

    console.log(`Downloading APK via artifact URL...`)
    const apk = await fetch(artifactUrl)
    if (!apk.ok) { console.log(`Download failed: ${apk.status}`); return }

    mkdirSync(apkDir, { recursive: true })
    writeFileSync(apkPath, Buffer.from(await apk.arrayBuffer()))
    console.log(`APK saved via CLI: ${(statSync(apkPath).size / 1024 / 1024).toFixed(1)} MB`)
  } catch (err) {
    console.log(`CLI strategy failed: ${err.message}`)
  }
}

fetchApk()
