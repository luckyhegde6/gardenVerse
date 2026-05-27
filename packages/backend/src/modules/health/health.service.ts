import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { REDIS_CLIENT } from '@/redis/redis.module';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async check() {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();

    const status = dbStatus === 'healthy' && redisStatus === 'healthy' ? 'healthy' : 'degraded';
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: `${uptime}s`,
      services: {
        database: dbStatus,
        redis: redisStatus,
        api: 'healthy',
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'healthy';
    } catch (error) {
      this.logger.error('Database health check failed', error.message);
      return 'unhealthy';
    }
  }

  private async checkRedis(): Promise<string> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG' ? 'healthy' : 'degraded';
    } catch (error) {
      this.logger.error('Redis health check failed', error.message);
      return 'unhealthy';
    }
  }

  async getDetailed() {
    const health = await this.check();

    let dbDetails = {};
    let redisDetails = {};

    try {
      const dbVersion: any = await this.prisma.$queryRaw`SELECT version()`;
      dbDetails = { version: dbVersion[0]?.version || 'unknown' };
    } catch { dbDetails = { error: 'Cannot connect' }; }

    try {
      const redisInfo = await this.redis.info('server');
      const versionMatch = redisInfo.match(/redis_version:(.+)/);
      redisDetails = { version: versionMatch ? versionMatch[1].trim() : 'unknown' };
    } catch { redisDetails = { error: 'Cannot connect' }; }

    return {
      ...health,
      details: {
        database: dbDetails,
        redis: redisDetails,
        memory: process.memoryUsage(),
        pid: process.pid,
      },
    };
  }
}
