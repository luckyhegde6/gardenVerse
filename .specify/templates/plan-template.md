# Implementation Plan: [Feature Name]

## Tech Stack Decisions
- **Backend**: [NestJS specifics]
- **Database**: [Prisma model changes]
- **Frontend**: [React Native specifics]
- **Infrastructure**: [New services, queues, etc.]

## Architecture Changes
Description of architectural changes needed.

### New Files
- `path/to/file.ts` — Purpose

### Modified Files
- `path/to/file.ts` — What changes

### Deleted Files
- `path/to/file.ts` — Why removed

## Data Model Changes
```prisma
// Prisma schema changes if any
```

## API Changes
### New Endpoints
- `POST /api/v1/...` — Description, request, response

### Modified Endpoints
- `GET /api/v1/...` — What changed

## Event Changes
### New Events
- `domain.action.type` — Payload, publisher, subscribers

### Modified Events
- `domain.action.type` — Schema diff

## Queue/Task Changes
- New queues, job types, worker changes

## Security Considerations
- Authentication requirements
- Authorization rules
- Data validation rules

## Migration Plan
- Database migrations
- Backward compatibility strategy
- Rollback plan

## Testing Plan
- Unit tests needed
- Integration tests needed
- E2E tests needed

## Performance Considerations
- Expected load
- Caching strategy
- Query optimization

## Research Notes
<!-- Findings from research phase -->
- [Research finding 1]
- [Research finding 2]
