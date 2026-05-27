# GardenVerse Constitution

## Governing Principles

### 1. Quality First
- TypeScript strict mode everywhere. No `any` types.
- 100% typed interfaces for all DTOs, responses, events, and API payloads.
- All code must pass lint and typecheck before merge.
- Test coverage minimum: 80% for services, 100% for critical paths (auth, payments, blockchain).

### 2. Security is Non-Negotiable
- All secrets in environment variables via ConfigService. Never in code.
- Passwords: bcrypt with 12 rounds minimum.
- JWT: 15m access tokens, 7d refresh tokens. Rotate on every refresh.
- QR payloads: encrypted (AES-256-GCM) + signed (HMAC-SHA256) with expiration timestamps.
- All user input validated via class-validator DTOs.
- Rate limiting on every public endpoint: 100 req/min per IP.
- Geolocation: store geohash only (precision ~1km). Never store exact coordinates.

### 3. Architecture Principles
- **Single Responsibility**: One module = one domain concern. If a module does two things, split it.
- **Event-Driven**: Cross-module communication via events only. No direct imports between domain modules.
- **Stateless Backend**: All state in Postgres/Redis. Instances can be killed and replaced at any time.
- **Defensive Design**: Assume all external inputs are malicious. Validate at the boundary.
- **Fail Fast**: Validate early in the request lifecycle. Fail with clear, actionable error messages.
- **Graceful Degradation**: If AI service is down, garden still works with cached recommendations.

### 4. Agent Autonomy
- Each agent owns its domain data and logic completely.
- Agents communicate via events, never via direct service imports.
- Agents can be independently deployed and scaled.
- Agent failure must not cascade — each agent degrades gracefully.
- Agent event contracts are versioned for forward/backward compatibility.

### 5. Testing Requirements
- Unit tests for all services and agents.
- E2E tests for critical user journeys (register, plant, harvest, trade).
- Integration tests for all API endpoints.
- Smart contract tests for all functions.
- Performance tests for high-load paths (IoT ingestion, marketplace listings).

### 6. Developer Experience
- Every new feature starts with a spec (`.specify/specs/<feature-name>/spec.md`).
- Every spec goes through: Clarify → Plan → Tasks → Implement → Review.
- Documentation is code. Update docs when you change code.
- Commit messages follow Conventional Commits format.

### 7. Governance
- All architectural decisions must be documented with rationale.
- Dependencies must be justified — no "it's popular" as a reason.
- Breaking changes require migration plans.
- Feature flags gate all new functionality.
