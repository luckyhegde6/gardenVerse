# Code Review Command

Review code for quality, security, and maintainability.

## Usage

```bash
/code-review [file or pattern]
```

## Checklist

### Code Quality
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling with logging
- [ ] No `any` types — use `unknown` instead
- [ ] Explicit return types on exported functions
- [ ] No `console.log` in production code

### Security
- [ ] No secrets exposed in logs
- [ ] Input validation via class-validator DTOs
- [ ] SQL injection prevention (Prisma only)
- [ ] XSS prevention in React/Native

### Architecture
- [ ] Module independence (no direct cross-module imports)
- [ ] Events for cross-module communication
- [ ] Config from ConfigService, not process.env

### Performance
- [ ] Proper caching strategy
- [ ] No N+1 Prisma queries
- [ ] Pagination on list endpoints

### Testing
- [ ] Critical paths have tests
- [ ] No broken tests
- [ ] Typecheck passes
