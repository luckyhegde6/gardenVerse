# Integration Testing Guidelines

## Test Stack
- **Framework**: Jest (NestJS backend)
- **Database**: Test PostgreSQL (Docker)
- **Redis**: Test Redis instance (Docker)
- **HTTP**: Supertest for API tests

## Test Structure
```
packages/backend/test/
  integration/
    auth.integration.spec.ts
    crops.integration.spec.ts
    marketplace.integration.spec.ts
  app.e2e-spec.ts       # NestJS e2e tests
```

## What to Test
Every API endpoint needs integration tests:
- Happy path (200)
- Validation errors (400)
- Authentication (401)
- Authorization (403)
- Not found (404)
- Rate limiting (429)

## Setup Pattern
```typescript
describe('Crops API', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('POST /api/v1/crops - should plant a crop', async () => { ... });
  it('POST /api/v1/crops - should reject unauthenticated', async () => { ... });
  it('POST /api/v1/crops - should validate required fields', async () => { ... });
});
```

## Test Database
```bash
# Start test database
docker run -d --name gardenverse-test-db \
  -e POSTGRES_DB=gardenverse_test \
  -e POSTGRES_USER=gardenverse \
  -e POSTGRES_PASSWORD=gardenverse123 \
  -p 5433:5432 postgres:16-alpine

# Run migrations
DATABASE_URL=postgresql://gardenverse:gardenverse123@localhost:5433/gardenverse_test \
  npx prisma migrate deploy

# Run integration tests
DATABASE_URL=postgresql://gardenverse:gardenverse123@localhost:5433/gardenverse_test \
  npm test -- --testPathPattern=integration
```

## Agent Integration Tests
Test event-driven agent communication:
```typescript
it('GameplayAgent should process weather events', async () => {
  const event = createMockWeatherEvent();
  await agentOrchestrator.emitEvent(AgentName.WEATHER, EVENT_TYPES.WEATHER_UPDATED, event);
  
  // Wait for async processing
  await new Promise(r => setTimeout(r, 100));
  
  // Verify gameplay agent responded
  const crops = await prisma.crop.findMany({ where: { userId: testUser.id } });
  expect(crops[0].weatherStressed).toBeDefined();
});
```
