// Fetch the latest APK from EAS and place it in public/downloads/
// Falls back to local APK if EAS is unavailable
// This runs during `vercel-build` to include the APK in the Vercel deployment

import { writeFileSync, mkdirSync, statSync, existsSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const apkDir = join(projectRoot, 'packages', 'admin', 'public', 'downloads')
const apkPath = join(apkDir, 'gardenverse-latest.apk')

const EXPO_TOKEN = process.env.EXPO_TOKEN
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID
const LOCAL_APK = join(projectRoot, 'packages', 'admin', 'public', 'downloads', 'gardenverse-latest.apk')

async function fetchApk() {
  // If APK already exists and is real (>1MB), skip
  try {
    const stat = statSync(apkPath)
    if (stat.size > 1_000_000) {
      console.log(`APK already exists (${(stat.size / 1024 / 1024).toFixed(1)} MB). Skipping.`)
      return
    }
  } catch {}

  console.log('APK placeholder detected. Trying EAS...')

  // Strategy 1: EAS REST API
  if (EXPO_TOKEN && EAS_PROJECT_ID) {
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
            console.log(`APK from EAS: ${(statSync(apkPath).size / 1024 / 1024).toFixed(1)} MB`)
            return
          }
        }
        console.log(`EAS: latest build has no artifact (status: ${latest?.status}).`)
      } else {
        console.log(`EAS API ${res.status}: ${(await res.text()).slice(0, 200)}`)
      }
    } catch (err) {
      console.log(`EAS error: ${err.message}`)
    }
  }

  // Strategy 2: Use local APK (if real)
  try {
    const localStat = statSync(LOCAL_APK)
    if (localStat.size > 1_000_000) {
      mkdirSync(apkDir, { recursive: true })
      copyFileSync(LOCAL_APK, apkPath)
      console.log(`APK copied from local: ${(localStat.size / 1024 / 1024).toFixed(1)} MB`)
      return
    }
  } catch {}

  console.log('No APK available. Download page will show placeholder.')
}

fetchApk()
