import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    if (method === 'GET') return next.handle();

    const skipPaths = ['/health', '/api/docs', '/analytics/track'];
    if (skipPaths.some((p) => url.startsWith(p))) return next.handle();

    return next.handle().pipe(
      tap(() => {
        const entity = url.split('/').filter(Boolean)[0] || 'unknown';
        this.prisma.auditLog.create({
          data: {
            action: `${method}:${url}`,
            entity,
            entityId: (request.params as any)?.id || 'unknown',
            ipAddress: ip,
            userAgent: headers?.['user-agent'],
            userId: user?.id,
          },
        }).catch((err: Error) => {
          this.logger.error('Audit log failed', err.message);
        });
      }),
    );
  }
}
