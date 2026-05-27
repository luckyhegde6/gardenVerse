import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: any): Promise<string> {
    return req.ips?.length ? req.ips[0] : req.ip;
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (user && user.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return true;
    }
    return false;
  }
}
