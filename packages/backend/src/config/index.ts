import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get('PORT', 3000);
  }

  get apiPrefix(): string {
    return this.configService.get('API_PREFIX', 'api/v1');
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', '');
  }

  get redis(): { host: string; port: number; password?: string } {
    return {
      host: this.configService.get('REDIS_HOST', '127.0.0.1'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', undefined),
    };
  }

  get jwt(): { secret: string; expiration: string; refreshSecret: string; refreshExpiration: string } {
    return {
      secret: this.configService.get('JWT_SECRET', 'default-secret'),
      expiration: this.configService.get('JWT_EXPIRATION', '15m'),
      refreshSecret: this.configService.get('JWT_REFRESH_SECRET', 'default-refresh-secret'),
      refreshExpiration: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    };
  }

  get encryptionKey(): string {
    return this.configService.get('ENCRYPTION_KEY', '');
  }

  get aiService(): { url: string; apiKey: string } {
    return {
      url: this.configService.get('AI_SERVICE_URL', 'http://localhost:8000'),
      apiKey: this.configService.get('AI_SERVICE_API_KEY', ''),
    };
  }

  get blockchain(): { rpcUrl: string; contractAddress: string } {
    return {
      rpcUrl: this.configService.get('BLOCKCHAIN_RPC_URL', ''),
      contractAddress: this.configService.get('BLOCKCHAIN_CONTRACT_ADDRESS', ''),
    };
  }

  get telegramBotToken(): string {
    return this.configService.get('TELEGRAM_BOT_TOKEN', '');
  }

  get weather(): { apiKey: string; apiUrl: string } {
    return {
      apiKey: this.configService.get('WEATHER_API_KEY', ''),
      apiUrl: this.configService.get('WEATHER_API_URL', 'https://api.openweathermap.org/data/2.5'),
    };
  }

  get fcmServerKey(): string {
    return this.configService.get('FCM_SERVER_KEY', '');
  }

  get throttle(): { ttl: number; limit: number } {
    return {
      ttl: this.configService.get('THROTTLE_TTL', 60),
      limit: this.configService.get('THROTTLE_LIMIT', 100),
    };
  }

  get requireEmailVerification(): boolean {
    return this.configService.get('REQUIRE_EMAIL_VERIFICATION', 'false') === 'true';
  }

  get socketCorsOrigin(): string {
    return this.configService.get('SOCKET_CORS_ORIGIN', 'http://localhost:5173');
  }

  get swagger(): { enabled: boolean; title: string; description: string; version: string; path: string } {
    return {
      enabled: this.configService.get('SWAGGER_ENABLED', 'true') === 'true',
      title: this.configService.get('SWAGGER_TITLE', 'GardenVerse API'),
      description: this.configService.get('SWAGGER_DESCRIPTION', 'GardenVerse API'),
      version: this.configService.get('SWAGGER_VERSION', '1.0'),
      path: this.configService.get('SWAGGER_PATH', 'api/docs'),
    };
  }
}
