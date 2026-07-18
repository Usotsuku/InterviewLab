import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthConfig {
  constructor(private readonly _config: ConfigService) {}

  get jwtSecret(): string {
    return this._config.get<string>('config.auth.jwtSecret')!;
  }

  get accessTokenExpiresIn(): string {
    return this._config.get<string>('config.auth.accessTokenExpiresIn')!;
  }

  get refreshTokenExpiresIn(): string {
    return this._config.get<string>('config.auth.refreshTokenExpiresIn')!;
  }

  get refreshTokenByteLength(): number {
    return 48;
  }

  get bcryptRounds(): number {
    return 12;
  }
}
