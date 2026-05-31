import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ message: 'Unhandled Rejection', reason: reason instanceof Error ? reason.message : reason, promise: String(promise) });
});

process.on('uncaughtException', (error) => {
  logger.error({ message: 'Uncaught Exception', error: error.message, stack: error.stack });
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const apiPrefix = configService.get('API_PREFIX', 'api/v1');

  app.setGlobalPrefix(apiPrefix);

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      service: 'GardenVerse API',
      status: 'running',
      version: '1.0.0',
      docs: `/${apiPrefix}/docs`,
      health: `/${apiPrefix}/health`,
    });
  });

  const nodeEnv = configService.get('NODE_ENV', 'development');
  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
  const corsOrigins = corsOrigin.split(',').map((o: string) => o.trim());

  const allowedOrigins = nodeEnv === 'production'
    ? [
        'https://gardenverse.vercel.app',
        ...corsOrigins.filter((o: string) => o.startsWith('https://')),
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8081',
        'http://127.0.0.1:3000',
        ...corsOrigins,
      ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cookie',
      'X-Trace-Id',
    ],
    maxAge: 86400,
  });

  app.use(helmet.default({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://*.gardenverse.vercel.app'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
    noSniff: true,
    strictTransportSecurity: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
  }));
  app.use(compression());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (configService.get('SWAGGER_ENABLED', 'true') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get('SWAGGER_TITLE', 'GardenVerse API'))
      .setDescription(configService.get('SWAGGER_DESCRIPTION', `
GardenVerse API - Admin & Super Admin Management

## Authentication
- **Bearer Token**: Add \`Authorization: Bearer <token>\` header (for programmatic/API clients)
- **httpOnly Cookies**: Browser clients receive tokens as secure, httpOnly cookies on login
- **Admin endpoints** require ADMIN or SUPER_ADMIN role

## Security
- All passwords hashed with bcrypt (12 rounds)
- JWT access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Rate limiting on all public endpoints
- Helmet security headers enabled
- CORS restricted to configured origins
      `))
      .setVersion(configService.get('SWAGGER_VERSION', '1.0'))
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter JWT access token' },
        'JWT-auth',
      )
      .addCookieAuth('access_token', {
        type: 'http', in: 'cookie', scheme: 'bearer',
        description: 'httpOnly cookie (auto-set on admin login)',
      })
      .addTag('Auth', 'Authentication and user management')
      .addTag('Admin', 'Admin & Super Admin portal endpoints')
      .addTag('Users', 'User profile and management')
      .addTag('Invite System', 'Invite code creation, validation, and redemption')
      .addTag('QR', 'QR code session management')
      .addTag('Analytics', 'Usage analytics and metrics')
      .addTag('Health', 'System health checks')
      .build();

    const options: SwaggerDocumentOptions = {
      operationIdFactory: (controllerKey: string, methodKey: string) => `${controllerKey}_${methodKey}`,
    };

    const document = SwaggerModule.createDocument(app, swaggerConfig, options);
    SwaggerModule.setup(
      configService.get('SWAGGER_PATH', 'api/docs'),
      app,
      document,
      {
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
        },
      },
    );
  }

  const port = parseInt(configService.get('PORT', '3001'), 10);
  await app.listen(port);

  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/${configService.get('SWAGGER_PATH', 'api/docs')}`);
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap().catch((err) => {
  logger.error({ message: 'Failed to start application', error: err.message, stack: err.stack });
  process.exit(1);
});
