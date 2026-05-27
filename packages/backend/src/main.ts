import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.setGlobalPrefix(configService.get('API_PREFIX', 'api/v1'));

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'X-Trace-Id'],
  });

  app.use(helmet.default({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
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

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/${configService.get('SWAGGER_PATH', 'api/docs')}`);
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap();
