## Summary

Improve `fetch-apk.mjs` to install EAS CLI during Vercel build as a fallback when REST API fails.

The EAS REST API returned 404 during Vercel build. This update adds:
1. Installs EAS CLI globally during build (`npm install -g eas-cli`)
2. Falls back to `eas build:download` command if REST API fails
3. Final fallback to `eas build:list` + artifact URL download
4. Increased timeout to 120s for CLI installation
