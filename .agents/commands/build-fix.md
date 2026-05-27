# Build Fix Command

Fix TypeScript compilation errors and build issues.

## Usage

```bash
/build-fix
```

## Workflow

1. Run `npm run typecheck` to see all errors
2. Fix errors one at a time, running typecheck after each
3. Run `npm run lint` for code style issues
4. Verify backend build: `npm run backend:build`
5. Verify admin build: `npm run admin:build`
