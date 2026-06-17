## Summary

Fix EAS CLI binary path resolution after global npm install on Vercel.

The `npm install -g eas-cli` succeeds on Vercel but the `eas` binary isn't in the default PATH that `execFile` uses. This fix resolves the full path using `npm root -g` and uses the absolute path to invoke the CLI.
