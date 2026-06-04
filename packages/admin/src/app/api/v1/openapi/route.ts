import { NextResponse } from 'next/server'

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'GardenVerse API',
    version: '1.0.0',
    description: `# GardenVerse API v1

Hybrid agriculture simulation ecosystem — virtual gardening, AI-powered agriculture assistant, IoT-enabled farming, and geospatial community platform.

## Authentication
Most endpoints require a Bearer JWT token in the Authorization header.
- **Access Token**: 15-minute expiry, returned from \`POST /auth/login\`
- **Refresh Token**: 7-day expiry, exchanged via \`POST /auth/refresh\`

## Response Format
Paginated responses use the \`paginated()\` helper:
\`\`\`json
{ "data": [...], "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
\`\`\`

Error responses return:
\`\`\`json
{ "error": "message" }
\`\`\``,
    contact: { name: 'GardenVerse', url: 'https://gardenverse.vercel.app' },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Same-origin (relative to this admin dashboard)',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Local development',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token from POST /auth/login or POST /auth/refresh',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Error message' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          displayName: { type: 'string' },
          avatarUrl: { type: 'string', format: 'uri' },
          role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
          isVerified: { type: 'boolean' },
          region: { type: 'string' },
          geohash: { type: 'string' },
          currentStreak: { type: 'integer' },
          longestStreak: { type: 'integer' },
          lastActiveAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'demo@gardenverse.vercel.app' },
          password: { type: 'string', format: 'password', example: 'password123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT access token (15m expiry)' },
          refreshToken: { type: 'string', description: 'JWT refresh token (7d expiry)' },
          expiresIn: { type: 'integer', example: 900 },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 3, maxLength: 30 },
          password: { type: 'string', format: 'password', minLength: 8 },
          displayName: { type: 'string' },
          inviteCode: { type: 'string', description: 'Optional invite code for private beta' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: 'Refresh token from login response' },
        },
      },
      OTPVerifyRequest: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email' },
          otp: { type: 'string', minLength: 6, maxLength: 6 },
        },
      },
      PasswordResetRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      PasswordResetConfirm: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string', description: 'Reset token from email' },
          password: { type: 'string', format: 'password', minLength: 8 },
        },
      },
      Garden: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['VIRTUAL', 'REAL', 'HYBRID'] },
          description: { type: 'string' },
          soilQuality: { type: 'integer', minimum: 0, maximum: 100 },
          irrigationLevel: { type: 'integer', minimum: 0, maximum: 100 },
          sunlightExposure: { type: 'integer', minimum: 0, maximum: 100 },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          address: { type: 'string' },
          timezone: { type: 'string' },
          theme: { type: 'string' },
          crops: { type: 'array', items: { $ref: '#/components/schemas/Crop' } },
          user: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Crop: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          species: { type: 'string' },
          status: { type: 'string', enum: ['SEED', 'SPROUTING', 'GROWING', 'MATURE', 'WILTED', 'HARVESTED'] },
          growthStage: { type: 'integer', minimum: 0, maximum: 5 },
          health: { type: 'integer', minimum: 0, maximum: 100 },
          hydration: { type: 'integer', minimum: 0, maximum: 100 },
          nutrientLevel: { type: 'integer', minimum: 0, maximum: 100 },
          plotX: { type: 'integer' },
          plotY: { type: 'integer' },
          plantedAt: { type: 'string', format: 'date-time' },
          estimatedHarvest: { type: 'string', format: 'date-time' },
          careStreak: { type: 'integer' },
          stressFactor: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
      TickRequest: {
        type: 'object',
        properties: {
          gameMinutes: { type: 'integer', default: 50, description: 'Number of game-minutes to advance' },
        },
      },
      TickResponse: {
        type: 'object',
        properties: {
          ticksApplied: { type: 'integer' },
          cropsUpdated: { type: 'integer' },
          crops: { type: 'array', items: { $ref: '#/components/schemas/Crop' } },
        },
      },
      MarketplaceListing: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          price: { type: 'number' },
          currency: { type: 'string', enum: ['GREEN_CREDITS', 'ECO_POINTS'] },
          quantity: { type: 'integer' },
          status: { type: 'string', enum: ['ACTIVE', 'SOLD', 'CANCELLED'] },
          images: { type: 'array', items: { type: 'string' } },
          location: { type: 'string' },
          isLocal: { type: 'boolean' },
          seller: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateListingRequest: {
        type: 'object',
        required: ['title', 'description', 'category', 'price', 'quantity'],
        properties: {
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string' },
          category: { type: 'string', enum: ['vegetables', 'fruits', 'herbs', 'plants', 'seeds', 'tools', 'other'] },
          price: { type: 'number', minimum: 0 },
          quantity: { type: 'integer', minimum: 1 },
          images: { type: 'array', items: { type: 'string', format: 'uri' } },
        },
      },
      CreateGardenRequest: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          type: { type: 'string', enum: ['VIRTUAL', 'REAL', 'HYBRID'] },
          description: { type: 'string', maxLength: 500 },
          soilQuality: { type: 'integer', minimum: 0, maximum: 100, default: 50 },
          theme: { type: 'string' },
          address: { type: 'string' },
          timezone: { type: 'string', default: 'UTC' },
        },
      },
      PlantCropRequest: {
        type: 'object',
        required: ['speciesId', 'plotX', 'plotY'],
        properties: {
          speciesId: { type: 'string', format: 'uuid' },
          plotX: { type: 'integer', minimum: 0 },
          plotY: { type: 'integer', minimum: 0 },
          name: { type: 'string', description: 'Optional custom name for the crop' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: { type: 'array' },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      PlantSpecies: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          scientificName: { type: 'string' },
          category: { type: 'string' },
          growingDays: { type: 'integer' },
          waterNeeds: { type: 'string', enum: ['low', 'moderate', 'high'] },
          sunRequirement: { type: 'string', enum: ['shade', 'partial', 'full_sun'] },
          difficulty: { type: 'string', enum: ['easy', 'moderate', 'hard'] },
          imageUrl: { type: 'string', format: 'uri' },
          description: { type: 'string' },
        },
      },
      WeatherRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          region: { type: 'string' },
          temperature: { type: 'number' },
          condition: { type: 'string' },
          humidity: { type: 'integer' },
          windSpeed: { type: 'number' },
          rainfall: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      UserStats: {
        type: 'object',
        properties: {
          gardenCount: { type: 'integer' },
          cropCount: { type: 'integer' },
          matureCrops: { type: 'integer' },
          wiltingCrops: { type: 'integer' },
          harvestCount: { type: 'integer' },
          totalCollections: { type: 'integer' },
          totalSpecies: { type: 'integer' },
          activeStreak: { type: 'integer' },
          longestStreak: { type: 'integer' },
          groupCount: { type: 'integer' },
          recentActivity: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                description: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      CommunityGroup: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          memberCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Invite: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string' },
          type: { type: 'string', enum: ['QR', 'LINK', 'TOKEN'] },
          isUsed: { type: 'boolean' },
          expiresAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'object', properties: { id: { type: 'string' }, username: { type: 'string' } } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AiScanResult: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          plantName: { type: 'string' },
          diseaseName: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          treatment: { type: 'string' },
          imageUrl: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'string' },
        },
      },
      DetailedHealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          database: { type: 'string', enum: ['connected', 'disconnected'] },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'string' },
        },
      },
      FeatureFlag: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          name: { type: 'string' },
          enabled: { type: 'boolean' },
          rolloutPercentage: { type: 'integer', minimum: 0, maximum: 100 },
          description: { type: 'string' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      IotDevice: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string', enum: ['online', 'offline', 'error'] },
          lastReading: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ModerationReport: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          reason: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'reviewed', 'actioned', 'dismissed'] },
          reportedBy: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SupportTicket: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          subject: { type: 'string' },
          status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      BlockchainTransaction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'failed'] },
          hash: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Disease: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          aliases: { type: 'array', items: { type: 'string' } },
          crops: { type: 'array', items: { type: 'string' } },
          type: { type: 'string', enum: ['fungus', 'virus', 'bacteria', 'insect', 'mite', 'nematode', 'deficiency', 'physiological', 'weed'] },
          symptoms: { type: 'array', items: { type: 'string' } },
          causes: { type: 'array', items: { type: 'string' } },
          spread: { type: 'string' },
          favorable_conditions: { type: 'array', items: { type: 'string' } },
          chemical_control: { type: 'array', items: { type: 'string' } },
          biological_control: { type: 'array', items: { type: 'string' } },
          prevention: { type: 'array', items: { type: 'string' } },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          regions: { type: 'array', items: { type: 'string' } },
          season: { type: 'array', items: { type: 'string' } },
          image_hint: { type: 'string' },
        },
      },
      DiseaseStats: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          byType: { type: 'object', additionalProperties: { type: 'integer' } },
          byCrop: { type: 'object', additionalProperties: { type: 'integer' } },
          severityCounts: { type: 'object', additionalProperties: { type: 'integer' } },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login',
        description: 'Authenticate user with email and password, returns JWT access and refresh tokens',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          '401': { description: 'Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register',
        description: 'Create a new user account',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
        responses: {
          '201': { description: 'Registration successful' },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout',
        description: 'Invalidate current session',
        security: [],
        responses: {
          '200': { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh Token',
        description: 'Exchange a valid refresh token for a new access token',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } } },
        responses: {
          '200': { description: 'Tokens refreshed', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          '401': { description: 'Invalid or expired refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Profile',
        description: 'Get the authenticated user\'s profile',
        responses: {
          '200': { description: 'User profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/verify-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify OTP',
        description: 'Verify one-time password for email confirmation',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OTPVerifyRequest' } } } },
        responses: {
          '200': { description: 'OTP verified' },
          '400': { description: 'Invalid OTP', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/admin/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Admin Login',
        description: 'Admin-specific login endpoint with elevated access',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          '200': { description: 'Admin login successful' },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/request-password-reset': {
      post: {
        tags: ['Authentication'],
        summary: 'Request Password Reset',
        description: 'Request a password reset email',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PasswordResetRequest' } } } },
        responses: {
          '200': { description: 'Reset email sent' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset Password',
        description: 'Reset password using a valid reset token',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PasswordResetConfirm' } } } },
        responses: {
          '200': { description: 'Password reset successful' },
          '400': { description: 'Invalid or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List Users',
        description: 'List all users with search, filter, sort, and pagination (admin only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or email' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['user', 'admin', 'super_admin'] } },
        ],
        responses: {
          '200': { description: 'Paginated user list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get User',
        description: 'Get detailed information for a specific user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'User details', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/users/me/stats': {
      get: {
        tags: ['Users'],
        summary: 'My Stats',
        description: 'Get aggregated profile statistics for the authenticated user',
        responses: {
          '200': { description: 'User stats', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserStats' } } } },
        },
      },
    },
    '/gardens': {
      get: {
        tags: ['Gardens'],
        summary: 'List Gardens',
        description: 'List all gardens with crops and user info',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['VIRTUAL', 'REAL', 'HYBRID'] } },
        ],
        responses: {
          '200': { description: 'Paginated garden list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Garden' } }, total: { type: 'integer' } } } } } },
        },
      },
      post: {
        tags: ['Gardens'],
        summary: 'Create Garden',
        description: 'Create a new garden',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateGardenRequest' } } } },
        responses: {
          '201': { description: 'Garden created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Garden' } } } },
        },
      },
    },
    '/gardens/{id}': {
      get: {
        tags: ['Gardens'],
        summary: 'Get Garden',
        description: 'Get garden details with crops',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Garden details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Garden' } } } },
          '404': { description: 'Garden not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/gardens/{id}/tick': {
      post: {
        tags: ['Gardens'],
        summary: 'Growth Tick',
        description: 'Advance crop growth by N game-minutes. Simulates growth for virtual gardens.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/TickRequest' } } } },
        responses: {
          '200': { description: 'Growth tick applied', content: { 'application/json': { schema: { $ref: '#/components/schemas/TickResponse' } } } },
          '404': { description: 'Garden not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/crops': {
      get: {
        tags: ['Crops'],
        summary: 'List Crops',
        description: 'List crops with optional filters',
        parameters: [
          { name: 'gardenId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['SEED', 'SPROUTING', 'GROWING', 'MATURE', 'WILTED', 'HARVESTED'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Crop list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Crop' } } } } } } },
        },
      },
      post: {
        tags: ['Crops'],
        summary: 'Plant Crop',
        description: 'Plant a new crop in a garden',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PlantCropRequest' } } } },
        responses: {
          '201': { description: 'Crop planted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Crop' } } } },
        },
      },
    },
    '/crops/{id}': {
      get: {
        tags: ['Crops'],
        summary: 'Get Crop',
        description: 'Get detailed crop information',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Crop details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Crop' } } } },
          '404': { description: 'Crop not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/plants': {
      get: {
        tags: ['Plants'],
        summary: 'List Plants',
        description: 'Browse plant species catalog with search and filters',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'difficulty', in: 'query', schema: { type: 'string', enum: ['easy', 'moderate', 'hard'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Plant species list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/PlantSpecies' } } } } } } },
        },
      },
    },
    '/weather': {
      get: {
        tags: ['Weather'],
        summary: 'Get Weather',
        description: 'Get current weather data for a region',
        parameters: [{ name: 'region', in: 'query', schema: { type: 'string' }, description: 'Region code (e.g., IN-KA, IN-MH)' }],
        responses: {
          '200': { description: 'Current weather', content: { 'application/json': { schema: { $ref: '#/components/schemas/WeatherRecord' } } } },
        },
      },
    },
    '/weather/forecast': {
      get: {
        tags: ['Weather'],
        summary: 'Get Forecast',
        description: 'Get 5-day weather forecast for a location',
        security: [],
        parameters: [
          { name: 'region', in: 'query', schema: { type: 'string' } },
          { name: 'lat', in: 'query', schema: { type: 'number' }, description: 'Latitude' },
          { name: 'lon', in: 'query', schema: { type: 'number' }, description: 'Longitude' },
        ],
        responses: {
          '200': { description: 'Weather forecast' },
        },
      },
    },
    '/weather/alerts': {
      get: {
        tags: ['Weather'],
        summary: 'Weather Alerts',
        description: 'Get active weather alerts and extreme condition warnings',
        security: [],
        responses: {
          '200': { description: 'Weather alerts' },
        },
      },
    },
    '/marketplace': {
      get: {
        tags: ['Marketplace'],
        summary: 'List Listings',
        description: 'List active marketplace listings with filters',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['vegetables', 'fruits', 'herbs', 'plants', 'seeds', 'tools', 'other'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Paginated listings', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/MarketplaceListing' } } } } } } },
        },
      },
      post: {
        tags: ['Marketplace'],
        summary: 'Create Listing',
        description: 'Create a new marketplace listing',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateListingRequest' } } } },
        responses: {
          '201': { description: 'Listing created', content: { 'application/json': { schema: { $ref: '#/components/schemas/MarketplaceListing' } } } },
        },
      },
    },
    '/marketplace/{id}': {
      get: {
        tags: ['Marketplace'],
        summary: 'Get Listing',
        description: 'Get marketplace listing details with seller info',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Listing details', content: { 'application/json': { schema: { $ref: '#/components/schemas/MarketplaceListing' } } } },
          '404': { description: 'Listing not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/marketplace/transactions': {
      get: {
        tags: ['Marketplace'],
        summary: 'List Transactions',
        description: 'List all marketplace transactions (admin only)',
        responses: {
          '200': { description: 'Transaction list' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health Check',
        description: 'Basic health check — returns status, uptime, and timestamp',
        security: [],
        responses: {
          '200': { description: 'Service healthy', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
        },
      },
    },
    '/health/detailed': {
      get: {
        tags: ['Health'],
        summary: 'Detailed Health',
        description: 'Detailed health check with database connectivity and metrics',
        security: [],
        responses: {
          '200': { description: 'Detailed health info', content: { 'application/json': { schema: { $ref: '#/components/schemas/DetailedHealthResponse' } } } },
        },
      },
    },
    '/community': {
      get: {
        tags: ['Community'],
        summary: 'Community Overview',
        description: 'Get community overview with active groups and stats',
        security: [],
        responses: {
          '200': { description: 'Community overview' },
        },
      },
    },
    '/community/groups': {
      get: {
        tags: ['Community'],
        summary: 'List Groups',
        description: 'List all community groups',
        responses: {
          '200': { description: 'Group list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/CommunityGroup' } } } } } } },
        },
      },
      post: {
        tags: ['Community'],
        summary: 'Create Group',
        description: 'Create a new community group',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } } },
        responses: {
          '201': { description: 'Group created' },
        },
      },
    },
    '/invites': {
      get: {
        tags: ['Invites'],
        summary: 'List Invites',
        description: 'List all invite codes',
        responses: {
          '200': { description: 'Invite list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Invite' } } } } } } },
        },
      },
      post: {
        tags: ['Invites'],
        summary: 'Create Invite',
        description: 'Generate a new invite code',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { type: { type: 'string', enum: ['QR', 'LINK', 'TOKEN'] } } } } } },
        responses: {
          '201': { description: 'Invite created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invite' } } } },
        },
      },
    },
    '/invites/redeem': {
      post: {
        tags: ['Invites'],
        summary: 'Redeem Invite',
        description: 'Redeem an invite code to gain access',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'string' } } } } } },
        responses: {
          '200': { description: 'Invite redeemed' },
        },
      },
    },
    '/ai': {
      get: {
        tags: ['AI Scanner'],
        summary: 'List Scans',
        description: 'List AI plant scan history',
        responses: {
          '200': { description: 'Scan history', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/AiScanResult' } } } } } } },
        },
      },
      post: {
        tags: ['AI Scanner'],
        summary: 'Submit Scan',
        description: 'Submit a plant photo for AI analysis',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { imageUrl: { type: 'string' }, plantName: { type: 'string' } } } } } },
        responses: {
          '201': { description: 'Scan submitted', content: { 'application/json': { schema: { $ref: '#/components/schemas/AiScanResult' } } } },
        },
      },
    },
    '/feature-flags': {
      get: {
        tags: ['Feature Flags'],
        summary: 'List Flags',
        description: 'List all feature flags (admin only)',
        responses: {
          '200': { description: 'Feature flag list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/FeatureFlag' } } } } } } },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List Notifications',
        description: 'List notifications for the authenticated user',
        responses: {
          '200': { description: 'Notification list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Notification' } } } } } } },
        },
      },
    },
    '/iot': {
      get: {
        tags: ['IoT Devices'],
        summary: 'List Devices',
        description: 'List IoT devices',
        responses: {
          '200': { description: 'Device list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/IotDevice' } } } } } } },
        },
      },
    },
    '/moderation/reports': {
      get: {
        tags: ['Moderation'],
        summary: 'List Reports',
        description: 'List moderation reports (admin only)',
        responses: {
          '200': { description: 'Report list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/ModerationReport' } } } } } } },
        },
      },
    },
    '/support/tickets': {
      get: {
        tags: ['Support'],
        summary: 'List Tickets',
        description: 'List support tickets (admin only)',
        responses: {
          '200': { description: 'Ticket list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/SupportTicket' } } } } } } },
        },
      },
    },
    '/admin': {
      get: {
        tags: ['Admin'],
        summary: 'Dashboard Stats',
        description: 'Get dashboard statistics (admin only)',
        responses: {
          '200': { description: 'Dashboard stats' },
        },
      },
    },
    '/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get Analytics',
        description: 'Retrieve platform-wide analytics (admin only)',
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['7d', '30d', '90d'] } },
        ],
        responses: {
          '200': { description: 'Analytics data' },
        },
      },
    },
    '/analytics/dau-mau': {
      get: {
        tags: ['Analytics'],
        summary: 'DAU/MAU Trends',
        description: 'DAU/MAU trend data by month (admin only)',
        responses: {
          '200': { description: 'DAU/MAU data' },
        },
      },
    },
    '/analytics/regional': {
      get: {
        tags: ['Analytics'],
        summary: 'Regional Stats',
        description: 'Regional user and garden breakdown (admin only)',
        responses: {
          '200': { description: 'Regional data' },
        },
      },
    },
    '/blockchain': {
      get: {
        tags: ['Blockchain'],
        summary: 'List Transactions',
        description: 'List blockchain transactions (admin only)',
        responses: {
          '200': { description: 'Transaction list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/BlockchainTransaction' } } } } } } },
        },
      },
    },
    '/logs': {
      get: {
        tags: ['System Logs'],
        summary: 'List Logs',
        description: 'List recent app logs (admin only)',
        responses: {
          '200': { description: 'Log list' },
        },
      },
    },
    '/queues': {
      get: {
        tags: ['Job Queues'],
        summary: 'List Queues',
        description: 'List job queues with counts (admin only)',
        responses: {
          '200': { description: 'Queue list' },
        },
      },
    },
    '/sidecars': {
      get: {
        tags: ['Sidecar Services'],
        summary: 'List Sidecars',
        description: 'List sidecar service status (admin only)',
        responses: {
          '200': { description: 'Sidecar list' },
        },
      },
    },
    '/diseases': {
      get: {
        tags: ['Diseases'],
        summary: 'List Diseases',
        description: 'Search and filter plant diseases. Supports query params: q (search query), crop, type, severity, stats (include stats summary)',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query matching name, aliases, symptoms, crops' },
          { name: 'crop', in: 'query', schema: { type: 'string' }, description: 'Filter by crop name' },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['fungus', 'virus', 'bacteria', 'insect', 'mite', 'nematode', 'deficiency', 'physiological', 'weed'] }, description: 'Filter by disease type' },
          { name: 'severity', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }, description: 'Filter by severity' },
          { name: 'stats', in: 'query', schema: { type: 'string' }, description: 'Include stats summary when present' },
        ],
        responses: {
          '200': { description: 'Disease list', content: { 'application/json': { schema: { type: 'object', properties: { diseases: { type: 'array', items: { $ref: '#/components/schemas/Disease' } }, total: { type: 'integer' }, stats: { $ref: '#/components/schemas/DiseaseStats' } } } } } },
        },
      },
    },
    '/diseases/{id}': {
      get: {
        tags: ['Diseases'],
        summary: 'Get Disease by ID',
        description: 'Get a single disease entry by its slug ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Disease ID (slug)' },
        ],
        responses: {
          '200': { description: 'Disease details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Disease' } } } },
          '404': { description: 'Disease not found' },
        },
      },
    },
    '/diseases/crop/{crop}': {
      get: {
        tags: ['Diseases'],
        summary: 'Get Diseases by Crop',
        description: 'Get all diseases that affect a specific crop',
        parameters: [
          { name: 'crop', in: 'path', required: true, schema: { type: 'string' }, description: 'Crop name (e.g. Tomato, Rice, Wheat)' },
        ],
        responses: {
          '200': { description: 'Diseases for crop', content: { 'application/json': { schema: { type: 'object', properties: { crop: { type: 'string' }, diseases: { type: 'array', items: { $ref: '#/components/schemas/Disease' } }, total: { type: 'integer' } } } } } },
          '404': { description: 'Crop not found' },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication, registration, password management' },
    { name: 'Users', description: 'User management and profile lookup' },
    { name: 'Gardens', description: 'Virtual garden management and growth simulation' },
    { name: 'Crops', description: 'Crop lifecycle management, planting, and harvesting' },
    { name: 'Plants', description: 'Plant species catalog' },
    { name: 'Weather', description: 'Real-time weather data, forecasts, and alerts' },
    { name: 'Marketplace', description: 'Product listings, transactions, and trading' },
    { name: 'Health', description: 'Service health checks and diagnostics' },
    { name: 'Community', description: 'Groups, member management, and social features' },
    { name: 'Invites', description: 'QR invite codes, referral links, and token-based invitations' },
    { name: 'AI Scanner', description: 'AI-powered plant disease detection' },
    { name: 'Feature Flags', description: 'Feature flag management' },
    { name: 'Notifications', description: 'Push and in-app notification management' },
    { name: 'IoT Devices', description: 'IoT sensor device management' },
    { name: 'Moderation', description: 'Content moderation queue and reports' },
    { name: 'Support', description: 'Support ticket management' },
    { name: 'Admin', description: 'Admin dashboard and platform configuration' },
    { name: 'Analytics', description: 'Platform analytics and metrics' },
    { name: 'Blockchain', description: 'Smart contract interaction and transactions' },
    { name: 'System Logs', description: 'Application logs' },
    { name: 'Job Queues', description: 'BullMQ job queue monitoring' },
    { name: 'Sidecar Services', description: 'Sidecar service health monitoring' },
    { name: 'Diseases', description: 'Plant disease database with treatments and prevention' },
  ],
}

export async function GET() {
  return NextResponse.json(spec)
}
