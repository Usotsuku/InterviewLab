import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export const AUTH_OPTIONS_KEY = 'auth_options';

export interface AuthOptions {
  jwt?: boolean;
}

export function CheckAuth(options: AuthOptions = { jwt: true }) {
  return applyDecorators(SetMetadata(AUTH_OPTIONS_KEY, options), UseGuards(JwtAuthGuard));
}
