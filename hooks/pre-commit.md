# Pre-Commit Hook

**Purpose**: Ensure code quality before every commit.
**Trigger**: `git commit`

## Checks
1. **TypeScript compilation** — `npx tsc --noEmit` (backend + admin)
2. **Lint** — `npm run lint` (all packages)
3. **Tests** — `npm test` (changed packages only)
4. **No secrets** — Check for committed `.env` files, API keys, passwords

## Quick Reference
```bash
# Manual run
npx tsc --noEmit
npm run lint
npm test
```

## Failure Resolution
- **TypeScript error**: Fix type issues, check for missing imports
- **Lint error**: Run `npm run lint -- --fix` for auto-fixable issues
- **Test failure**: Check test output, fix broken tests
- **Secret detected**: Remove file, add to `.gitignore`, rotate compromised key
