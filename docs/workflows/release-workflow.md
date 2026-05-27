# Release Workflow

## Overview
GardenVerse follows a phased release process: Development → Staging → Production.

## Release Cadence
- **Development**: Continuous (per-feature deploys)
- **Staging**: Weekly (Wednesday)
- **Production**: Bi-weekly (Friday)

## Release Checklist

### Pre-Release
- [ ] All specs in `specs/` are complete
- [ ] All feature flags evaluated (new features = off by default)
- [ ] Full test suite passes:
  ```bash
  npm test                    # Unit + integration
  npx playwright test         # E2E
  npx hardhat test            # Contracts
  ```
- [ ] Security review complete (see `skills/security-review.md`)
- [ ] Performance benchmarks within thresholds:
  - API p95 latency < 200ms
  - Database query p95 < 50ms
  - IoT ingestion rate > 1000 msg/s
- [ ] Database migrations tested (rollback verified)
- [ ] Changelog updated
- [ ] Version bumped (`npm version <major|minor|patch>`)

### Staging Release
1. Merge `develop` into `release/*` branch
2. Deploy to staging environment
3. Run smoke tests:
   ```bash
   curl -f http://staging.api.gardenverse.io/health
   npx playwright test --grep "@smoke"
   ```
4. Verify monitoring dashboards
5. Internal QA sign-off

### Production Release
1. Merge `release/*` into `main`
2. Tag release: `git tag vX.Y.Z && git push origin vX.Y.Z`
3. Deploy to production (GitHub Actions)
4. Gradual rollout:
   - 10% traffic → monitor 15 min
   - 25% traffic → monitor 15 min
   - 50% traffic → monitor 30 min
   - 100% traffic → final
5. Verify production health dashboards
6. Post-release monitoring (24h)

### Rollback
If any metric degrades > 10%:
1. Revert to previous `main` commit
2. Deploy rollback
3. Notify team
4. Post-mortem within 24h

## Feature Flag Strategy
All new features behind feature flags:
```typescript
FEATURE_AI_DIAGNOSIS: { enabled: false, rollout: 0.1 }
FEATURE_MARKETPLACE: { enabled: true, rollout: 1.0 }
FEATURE_IOT_BETA: { enabled: false, rollout: 0.05 }
```
- Gradual rollout: 10% → 25% → 50% → 100%
- Regional targeting supported
- Kill switch capability (disable instantly)
