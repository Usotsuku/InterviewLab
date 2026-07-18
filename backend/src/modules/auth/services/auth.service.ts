import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '@modules/users/repositories/users.repository';
import { UserSessionRepository } from '../repositories/user-session.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AUTH_ERRORS } from '../auth.errors';
import { AppException } from '@core/exceptions/app.exception';
import { JwtPayload } from '@core/decorators/current-user.decorator';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  private readonly _logger = new Logger(AuthService.name);

  constructor(
    private readonly _usersRepo: UsersRepository,
    private readonly _sessionRepo: UserSessionRepository,
    private readonly _passwordService: PasswordService,
    private readonly _tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existing = await this._usersRepo.findByEmail(dto.email);
    if (existing) {
      AppException.throw(AUTH_ERRORS.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await this._passwordService.hash(dto.password);
    const user = await this._usersRepo.create({
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      name: dto.name,
      role: 'user',
    });

    const userId = (user as unknown as { _id: Types.ObjectId })._id.toString();
    const tokens = await this._issueTokens(userId, dto.email, 'user');

    this._logger.log(`[register] User registered: ${userId}`);

    return {
      user: { id: userId, email: dto.email, name: dto.name, role: 'user' },
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this._usersRepo.findByEmail(dto.email);
    if (!user) {
      AppException.throw(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const passwordMatch = await this._passwordService.compare(dto.password, user.password);
    if (!passwordMatch) {
      AppException.throw(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const userId = (user as unknown as { _id: Types.ObjectId })._id.toString();
    const tokens = await this._issueTokens(userId, user.email, user.role);

    this._logger.log(`[login] User logged in: ${userId}`);

    return {
      user: { id: userId, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<RefreshResponse> {
    const hashedToken = this._tokenService.hashRefreshToken(dto.refreshToken);
    const session = await this._sessionRepo.findByRefreshTokenHash(hashedToken);
    if (!session) {
      AppException.throw(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    if (new Date() > session.expiresAt) {
      AppException.throw(AUTH_ERRORS.EXPIRED_REFRESH_TOKEN);
    }

    if (!session.isValid) {
      AppException.throw(AUTH_ERRORS.INACTIVE_SESSION);
    }

    const sessionId = (session as unknown as { _id: Types.ObjectId })._id.toString();
    await this._sessionRepo.invalidateSession(sessionId);

    const userId = (session.userId as Types.ObjectId).toString();
    const user = await this._usersRepo.findById(userId);
    if (!user) {
      AppException.throw(AUTH_ERRORS.USER_NOT_FOUND);
    }

    const tokens = await this._issueTokens(userId, user.email, user.role);

    this._logger.log(`[refresh] Session rotated: ${sessionId}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    const hashedToken = this._tokenService.hashRefreshToken(dto.refreshToken);
    const session = await this._sessionRepo.findByRefreshTokenHash(hashedToken);
    if (session) {
      const sessionId = (session as unknown as { _id: Types.ObjectId })._id.toString();
      await this._sessionRepo.invalidateSession(sessionId);
      this._logger.log(`[logout] Session invalidated: ${sessionId}`);
    }

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this._usersRepo.findById(userId);
    if (!user) {
      AppException.throw(AUTH_ERRORS.USER_NOT_FOUND);
    }

    const doc = user as unknown as { _id: Types.ObjectId; createdAt: Date };
    return {
      id: doc._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: doc.createdAt,
    };
  }

  private async _issueTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const plainRefreshToken = this._tokenService.generateRefreshToken();
    const hashedRefreshToken = this._tokenService.hashRefreshToken(plainRefreshToken);

    const expiresMs = this._tokenService.parseRefreshTokenExpiry();
    const expiresAt = new Date(Date.now() + expiresMs);

    await this._sessionRepo.create({
      userId: new Types.ObjectId(userId),
      refreshToken: hashedRefreshToken,
      expiresAt,
      isValid: true,
    });

    const payload: JwtPayload = {
      sub: userId,
      sessionId: '', // will be set after session creation
      email,
      role,
    };

    const accessToken = await this._tokenService.generateAccessToken(payload);

    return { accessToken, refreshToken: plainRefreshToken };
  }
}
