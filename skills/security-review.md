# Skill: Security Review

**Description**: Perform a security review of code changes.
**Version**: 1.0.0
**Category**: Security

## Trigger
Before merging any code that:
- Handles user authentication or authorization
- Processes user input
- Stores or transmits personal data
- Interacts with external APIs
- Changes database schema
- Modifies blockchain contracts

## Instructions

### Authentication Review
1. Verify JWT tokens have short expiry (15m access, 7d refresh)
2. Check that refresh token rotation is implemented
3. Verify OTP rate limiting (max 5 attempts per phone/email per hour)
4. Confirm bcrypt salt rounds = 12

### Authorization Review
1. Verify RBAC guards on all protected endpoints
2. Check that admin endpoints require ADMIN or SUPER_ADMIN role
3. Verify user-scoped queries include userId filter

### Input Validation Review
1. Confirm class-validator DTOs on all POST/PUT/PATCH endpoints
2. Check for raw SQL queries (should be none — Prisma only)
3. Verify file upload type and size validation

### Data Protection Review
1. Verify geohash-only location storage (never exact coordinates)
2. Check QR payload encryption (AES-256-GCM) + signing
3. Verify message encryption in chat module
4. Confirm no secrets in code or logs

### Infrastructure Review
1. Rate limiting on all public endpoints
2. Helmet headers configured
3. CORS restricted to known origins
4. No debug endpoints in production

## Validation
- [ ] All BLOCKER items resolved
- [ ] All MAJOR items resolved or have tickets
- [ ] Security checklist signed off
