# GardenVerse Coding Standards

## TypeScript Rules

- **Strict mode enabled** — do not disable strict checks
- Use explicit return types for exported functions
- Use `unknown` for external API responses, then narrow with type guards
- **Avoid `any`** — use `unknown` or proper typing instead
- No `console.log` in production code (use `Logger` from `@nestjs/common`)
- All API endpoints must have validated DTOs (`class-validator`)

## Import Order

1. NestJS imports (`@nestjs/*`)
2. External libraries (`@prisma/client`, `bcrypt`, etc.)
3. Internal modules (`@/modules/*`, `@/common/*`)
4. Local imports (`./dto/create.dto`)

```typescript
// Correct order
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateGardenDto } from './dto/create-garden.dto';
```

## Naming Conventions

- **Files**: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- **Classes/Services**: `PascalCase` (`GardenService`, `CropController`)
- **Functions/Methods**: `camelCase` (`getCropById()`, `calculateGrowthStage()`)
- **Variables**: `camelCase` (`cropList`, `gardenCount`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`)
- **Database models**: `PascalCase` (`PlantSpecies`, `CropVariety`)
- **Database fields**: `camelCase` (`growingDays`, `scientificName`)
- **API routes**: `kebab-case` (`/api/v1/plant-species`)
- **Events**: `domain.action.type` (`garden.crop.planted`)

## Module Structure (Backend)

```
module-name/
  module.ts        # NestJS module definition
  controller.ts    # REST endpoints
  service.ts       # Business logic
  dto/
    create.dto.ts
    update.dto.ts
    query.dto.ts
  interfaces/
    index.ts
  events/          # Event definitions (if applicable)
```

## Error Handling

- Use NestJS `Logger` for all logging (never `console.log`)
- Use `class-validator` DTOs for all input validation
- Throw `HttpException` with proper status codes
- Always catch and log errors with context
- Return safe defaults on external API failures (graceful degradation)

```typescript
// Good
const logger = new Logger('CropService');
try {
  return await this.prisma.crop.findMany({ where: { userId } });
} catch (error) {
  logger.error({ message: 'Failed to fetch crops', userId, error });
  throw new NotFoundException('Crops not found');
}
```

## React Native / Mobile

- Static imports only (no `await import(...)`) — module setting doesn't support dynamic
- Use `SafeAreaView` for notched devices
- Handle loading, error, and empty states in all screens
- All API calls go through the services layer

## React / Admin (Next.js)

- Server Components by default, Client Components when needed
- Use TailwindCSS for styling
- Handle loading, error, and empty states in all pages

## Security

- All passwords: bcrypt 12 rounds minimum
- JWT: 15m access token, 7d refresh token
- Geolocation: store geohash only, never exact coordinates
- Upload validation: file type, size (max 10MB)
- Rate limiting on all public endpoints
- Helmet + CORS for production
- NEVER store API keys or secrets in client code

## Testing

- Backend: Jest unit tests for all services + E2E for critical flows
- Mobile: Component tests with React Native Testing Library
- E2E: Playwright screenshots at 1440×900
- All E2E tests must be independent (separate browser contexts)
