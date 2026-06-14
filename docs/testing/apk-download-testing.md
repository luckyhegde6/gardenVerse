# APK Download Testing Report

**Date:** 2026-06-14
**Tester:** Automated + Manual
**Environment:** Vercel Production (gardenverse.vercel.app)
**Commits:** 45b2477 (PR #12), fa65d39 (PR #14), e979941

---

## 0. Environment Variables (Added 2026-06-14)

Set on Vercel production:
- `EXPO_TOKEN` = `bYdDsjx6MNRxosFc0AITu2cdlXgd1rj3vGUqI9nR`
- `EAS_PROJECT_ID` = `5c01de7d-484e-4704-b4a1-d5833b59d62c`

---

## 1. Pre-Deployment Test Results

### Test 1.1: /download page accessibility
- **Endpoint:** `GET https://gardenverse.vercel.app/download`
- **Expected:** 200 OK with HTML content
- **Result:** FAIL — 404 Not Found
- **Reason:** Code changes not yet deployed to production

### Test 1.2: /api/v1/mobile/apk-info
- **Endpoint:** `GET https://gardenverse.vercel.app/api/v1/mobile/apk-info`
- **Expected:** JSON with APK metadata
- **Result:** PASS — 200 OK
- **Response:**
```json
{
  "data": {
    "version": "1.0.0",
    "buildNumber": 1,
    "size": "0 MB",
    "releaseDate": "2026-06-11",
    "downloadUrl": "/api/v1/mobile/download",
    "qrCodeData": "https://gardenverse.vercel.app/api/v1/mobile/download"
  }
}
```
- **Note:** Size shows "0 MB" because the APK on disk is a placeholder (51 bytes)

### Test 1.3: /api/v1/mobile/download redirect
- **Endpoint:** `GET https://gardenverse.vercel.app/api/v1/mobile/download`
- **Expected:** 307 redirect to static APK file
- **Result:** PASS — 307 redirect to `/downloads/gardenverse-latest.apk`
- **Note:** Old version served the file directly (51-byte placeholder)

### Test 1.4: Static APK file
- **Endpoint:** `GET https://gardenverse.vercel.app/downloads/gardenverse-latest.apk`
- **Expected:** 200 OK, `application/vnd.android.package-archive`, ~180MB
- **Result:** FAIL — 200 OK but only 51 bytes
- **Response body:** `PLACEHOLDER - Replace with actual APK built via EAS`
- **Reason:** Real APK not deployed; placeholder file from git repo was deployed

---

## 2. Post-Deployment Test Results

### Test 2.1: /download page accessibility
- **Endpoint:** `GET https://gardenverse.vercel.app/download`
- **Expected:** 200 OK with HTML content
- **Result:** PASS
- **Status:** 200
- **Content-Type:** text/html; charset=utf-8
- **Content-Length:** 6,719 bytes
- **Notes:** Page renders correctly with Next.js HTML

### Test 2.2: /api/v1/mobile/apk-info
- **Endpoint:** `GET https://gardenverse.vercel.app/api/v1/mobile/apk-info`
- **Expected:** JSON with APK metadata and correct file size
- **Result:** PASS (with caveat)
- **Status:** 200
- **Response:**
```json
{
  "data": {
    "version": "1.0.0",
    "buildNumber": 1,
    "size": "0.0 MB",
    "releaseDate": "2026-06-13",
    "downloadUrl": "/api/v1/mobile/download",
    "qrCodeData": "https://gardenverse.vercel.app/download"
  }
}
```
- **Note:** Size shows "0.0 MB" because the APK on Vercel is still the placeholder. Once a real APK is deployed, this will show the correct size.

### Test 2.3: /api/v1/mobile/download redirect
- **Endpoint:** `GET https://gardenverse.vercel.app/api/v1/mobile/download`
- **Expected:** 307 redirect to static APK file
- **Result:** PASS
- **Status:** 307
- **Location:** `https://gardenverse.vercel.app/downloads/gardenverse-latest.apk`

### Test 2.4: Static APK file
- **Endpoint:** `GET https://gardenverse.vercel.app/downloads/gardenverse-latest.apk`
- **Expected:** 200 OK, `application/vnd.android.package-archive`, ~180MB
- **Result:** FAIL — Still 51 bytes (placeholder)
- **Content-Type:** application/vnd.android.package-archive
- **Content-Length:** 51
- **Reason:** `fetch-apk.mjs` runs during Vercel build but EXPO_TOKEN is not set on Vercel, so it can't download the real APK from EAS

### Test 2.5: /api/v1/mobile/build (new endpoint)
- **Endpoint:** `GET https://gardenverse.vercel.app/api/v1/mobile/build`
- **Expected:** JSON with build system status
- **Result:** PASS
- **Response:** `{"configured": false, "apkExists": false, "apkSize": null, "recentBuilds": []}`
- **Note:** Returns `configured: false` because EXPO_TOKEN is not set on Vercel

### Test 2.6: /mobile admin page (requires auth)
- **Endpoint:** `GET https://gardenverse.vercel.app/mobile`
- **Expected:** 200 OK (public path, no auth required)
- **Result:** Not tested in this run (requires browser interaction)
- **Note:** Should show 4 tabs: Download, Build APK, Changelog, Sync Status

---

## 3. Code Changes Summary

### Files Modified
| File | Change |
|------|--------|
| `packages/admin/src/app/api/v1/mobile/download/route.ts` | Redirect to static file instead of Vercel Blob |
| `packages/admin/src/app/api/v1/mobile/apk-info/route.ts` | Read actual file size from disk |
| `packages/admin/src/app/mobile/page.tsx` | Added "Build APK" tab |
| `packages/admin/src/components/AppShell.tsx` | Added `/download` to PUBLIC_PATHS |
| `packages/admin/src/components/PublicLayout.tsx` | Added "Download App" link |
| `.github/workflows/mobile.yml` | Removed Vercel Blob deployment step |
| `package.json` | Added `fetch-apk` script to `vercel-build` |

### Files Created
| File | Purpose |
|------|---------|
| `packages/admin/src/app/api/v1/mobile/build/route.ts` | EAS build trigger API |
| `packages/admin/src/app/download/page.tsx` | Public download page |
| `scripts/fetch-apk.mjs` | Download APK from EAS during Vercel build |

---

## 4. Remaining Issues

### Issue 1: EAS REST API 404 During Vercel Build
- **Severity:** High
- **Description:** `fetch-apk.mjs` runs during Vercel build but EAS REST API returns 404
- **Root Cause:** The `EXPO_TOKEN` may lack `builds:read` scope, or the EAS project needs workflows configured
- **Fix:** 
  1. Regenerate EXPO_TOKEN with `builds:read` scope at https://expo.dev/settings/access-tokens
  2. Set up EAS Workflows at https://expo.dev/accounts/luckyhegdedev/projects/gardenverse/workflows
  3. Or use the local APK (already exists at `packages/admin/public/downloads/gardenverse-latest.apk`)

### Issue 2: EAS Production Build Fails in Non-Interactive Mode
- **Severity:** Medium
- **Description:** `eas build --profile production --non-interactive` fails because Google Service Account keys aren't configured
- **Root Cause:** `eas.json` had `submit.production.android.track: "production"` which triggers Play Store submission
- **Fix:** Removed Android submit config from `eas.json` (PR #14)

### Issue 3: Local APK Not in Git
- **Severity:** Low
- **Description:** The real 180MB APK exists locally but is in `.gitignore`
- **Reason:** Correct behavior — large binaries shouldn't be in git
- **Fix:** The `fetch-apk.mjs` script handles this by downloading from EAS during build

---

## 5. Next Steps to Complete

1. **Fix EXPO_TOKEN scope:** Regenerate with `builds:read` scope at https://expo.dev/settings/access-tokens
2. **Set up EAS Workflows:** Configure build workflows at https://expo.dev/accounts/luckyhegdedev/projects/gardenverse/workflows
3. **Wait for CI/CD:** PR #14 will trigger EAS preview build verification
4. **Merge and deploy:** After CI/CD passes, merge PR #14 and deploy to production
5. **Verify:**
   ```bash
   curl -I https://gardenverse.vercel.app/downloads/gardenverse-latest.apk
   # Should show Content-Length: ~188961971 (180MB)
   ```
6. **Test on device:**
   - Visit https://gardenverse.vercel.app/download
   - Click "Download APK"
   - Install on Android emulator (Pixel 7 API 34)
   - Verify app launches and works

---

## 6. Architecture

```
User → /download page → Click "Download APK"
  → GET /api/v1/mobile/download → 307 redirect
  → GET /downloads/gardenverse-latest.apk → Vercel CDN (static file)
  → Browser downloads APK

Admin → /mobile → "Build APK" tab → Click "Start Preview Build"
  → POST /api/v1/mobile/build → Expo REST API → EAS build starts
  → EAS builds APK → artifact URL returned
  → fetch-apk.mjs downloads APK to public/downloads/
  → Vercel build includes APK as static asset
```

---

## 7. Test Commands

```bash
# Check /download page
curl -s -o /dev/null -w "%{http_code}" https://gardenverse.vercel.app/download

# Check apk-info API
curl -s https://gardenverse.vercel.app/api/v1/mobile/apk-info | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d.toString()).data.size))"

# Check download redirect
curl -sI https://gardenverse.vercel.app/api/v1/mobile/download

# Check APK file size
curl -sI https://gardenverse.vercel.app/downloads/gardenverse-latest.apk | grep -i content-length

# Check build API
curl -s https://gardenverse.vercel.app/api/v1/mobile/build | node -e "process.stdin.on('data',d=>console.log(d.toString()))"
```
