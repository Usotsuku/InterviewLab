import { SetMetadata } from '@nestjs/common';

export const AUTH_OPTIONS_KEY = 'auth_options';

export interface AuthOptions {
  jwt?: boolean;
}

export function CheckAuth(options: AuthOptions = { jwt: true }) {
  return SetMetadata(AUTH_OPTIONS_KEY, options);
}
