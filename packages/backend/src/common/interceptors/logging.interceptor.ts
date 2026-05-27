import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '@/prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const now = Date.now();
    const traceId = request.traceId || uuid();
    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const duration = Date.now() - now;

        this.logger.log(`${method} ${url} ${statusCode} ${duration}ms [${traceId}]`);

        if (duration > 1000) {
          this.prisma.appLog.create({
            data: {
              level: 'WARN',
              message: `Slow request: ${method} ${url} ${duration}ms`,
              context: 'response_time',
              metadata: { duration, method, url, statusCode, traceId },
              ipAddress: ip,
              traceId,
              userId: user?.id,
              source: 'backend',
            },
          }).catch(() => {});
        }
      }),
      catchError((err) => {
        const duration = Date.now() - now;
        this.logger.error(`${method} ${url} ${err.status || 500} ${duration}ms [${traceId}]: ${err.message}`);

        this.prisma.appLog.create({
          data: {
            level: 'ERROR',
            message: `${method} ${url}: ${err.message}`,
            context: err.name,
            metadata: { duration, method, url, statusCode: err.status || 500, traceId, stack: err.stack?.slice(0, 500) },
            ipAddress: ip,
            traceId,
            userId: user?.id,
            source: 'backend',
          },
        }).catch(() => {});

        throw err;
      }),
    );
  }
}
