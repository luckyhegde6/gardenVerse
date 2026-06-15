## Summary

Remove Android auto-submit from `eas.json` to fix non-interactive EAS builds.

The production build profile had `submit.production.android.track: "production"` which triggered Play Store submission during `eas build --non-interactive`. Google Service Account keys aren't available in non-interactive mode, causing the build to fail.

This removes the Android submit config. iOS submit config is preserved. Android builds will still produce AAB files but won't auto-submit to Play Store.
