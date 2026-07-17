import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class AuthService {
  async register(_dto: RegisterDto): Promise<{ message: string }> {
    // TODO: implement registration foundation
    return { message: 'TODO: register user foundation' };
  }

  async login(_dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    // TODO: implement login validation and session issuance
    return { accessToken: 'TODO_ACCESS_TOKEN', refreshToken: 'TODO_REFRESH_TOKEN' };
  }

  async refresh(_dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    // TODO: implement session rotation
    return { accessToken: 'TODO_NEW_ACCESS_TOKEN', refreshToken: 'TODO_NEW_REFRESH_TOKEN' };
  }

  async logout(_dto: RefreshTokenDto): Promise<{ message: string }> {
    // TODO: implement session revocation
    return { message: 'TODO: logout successfully' };
  }
}
