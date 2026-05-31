import { Global, Module, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const client = new Redis({
          host: configService.get('REDIS_HOST', '127.0.0.1'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD', undefined),
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableOfflineQueue: true,
        });

        client.on('error', (err) => {
          logger.warn({ message: 'Redis connection error (server will continue running)', error: err.message });
        });

        client.on('connect', () => {
          logger.log('Redis connected successfully');
        });

        client.on('close', () => {
          logger.warn('Redis connection closed');
        });

        client.on('reconnecting', (delay: number) => {
          logger.log(`Redis reconnecting in ${delay}ms`);
        });

        // Attempt connection asynchronously — don't block server startup
        client.connect().catch((err) => {
          logger.warn({ message: 'Redis initial connection failed (server continuing)', error: err.message });
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
