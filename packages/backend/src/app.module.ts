import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GardensModule } from './modules/gardens/gardens.module';
import { CropsModule } from './modules/crops/crops.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { WeatherModule } from './modules/weather/weather.module';
import { AiModule } from './modules/ai/ai.module';
import { IotModule } from './modules/iot/iot.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GeoModule } from './modules/geo/geo.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { InviteSystemModule } from './modules/invite-system/invite-system.module';
import { CommunityModule } from './modules/community/community.module';
import { ChatModule } from './modules/chat/chat.module';
import { QrModule } from './modules/qr/qr.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { PlantsModule } from './modules/plants/plants.module';
import { UploadModule } from './modules/upload/upload.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RedisModule } from './redis/redis.module';
import { AgentModule } from './agents/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL', 60),
            limit: config.get('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD', undefined),
        },
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    GardensModule,
    CropsModule,
    MarketplaceModule,
    WeatherModule,
    AiModule,
    IotModule,
    NotificationsModule,
    GeoModule,
    IntelligenceModule,
    ModerationModule,
    BlockchainModule,
    ReputationModule,
    InviteSystemModule,
    CommunityModule,
    ChatModule,
    QrModule,
    FeatureFlagsModule,
    AnalyticsModule,
    AdminModule,
    HealthModule,
    PlantsModule,
    UploadModule,
    AgentModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
