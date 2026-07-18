import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthConfig } from '@core/config/auth.config';

@Injectable()
export class PasswordService {
  private readonly _logger = new Logger(PasswordService.name);

  constructor(private readonly _authConfig: AuthConfig) {}

  async hash(plain: Promise<string> | string): Promise<string> {
    const value = await plain;
    return bcrypt.hash(value, this._authConfig.bcryptRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
