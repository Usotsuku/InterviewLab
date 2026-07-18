import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthConfig } from '@core/config/auth.config';
import { JwtPayload } from '@core/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy {
  private readonly _logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly _jwtService: JwtService,
    private readonly _authConfig: AuthConfig,
  ) {}

  async verify(token: string): Promise<JwtPayload> {
    return this._jwtService.verifyAsync<JwtPayload>(token, {
      secret: this._authConfig.jwtSecret,
    });
  }

  async sign(payload: JwtPayload): Promise<string> {
    return this._jwtService.signAsync(payload, {
      secret: this._authConfig.jwtSecret,
      expiresIn: this._authConfig.accessTokenExpiresIn,
    });
  }
}
