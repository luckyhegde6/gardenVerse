import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET', 'default-refresh-secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
