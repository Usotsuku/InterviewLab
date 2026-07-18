import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { AuthConfig } from '@core/config/auth.config';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtPayload } from '@core/decorators/current-user.decorator';

@Injectable()
export class TokenService {
  private readonly _logger = new Logger(TokenService.name);

  constructor(
    private readonly _jwtStrategy: JwtStrategy,
    private readonly _authConfig: AuthConfig,
  ) {}

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this._jwtStrategy.sign(payload);
  }

  generateRefreshToken(): string {
    return randomBytes(this._authConfig.refreshTokenByteLength).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  parseRefreshTokenExpiry(): number {
    const match = this._authConfig.refreshTokenExpiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
