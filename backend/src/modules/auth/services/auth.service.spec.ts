import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersRepository } from '@modules/users/repositories/users.repository';
import { UserSessionRepository } from '../repositories/user-session.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { AUTH_ERRORS } from '../auth.errors';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersRepo = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockSessionRepo = {
    create: jest.fn(),
    findActiveByUserId: jest.fn().mockResolvedValue([]),
    invalidateSession: jest.fn().mockResolvedValue(true),
  };

  const mockPasswordService = {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn(),
  };

  const mockTokenService = {
    generateAccessToken: jest.fn().mockResolvedValue('access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('plain-refresh-token'),
    hashRefreshToken: jest.fn().mockReturnValue('hashed-refresh-token'),
    parseRefreshTokenExpiry: jest.fn().mockReturnValue(7 * 24 * 60 * 60 * 1000),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: UserSessionRepository, useValue: mockSessionRepo },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue(null);
      mockUsersRepo.create.mockResolvedValue({ _id: { toString: () => 'user1' }, email: 'new@test.com', name: 'New', role: 'user' });

      const result = await service.register({ email: 'new@test.com', password: 'pass1234', name: 'New' });
      expect(result.user.email).toBe('new@test.com');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('plain-refresh-token');
      expect(mockUsersRepo.create).toHaveBeenCalled();
      expect(mockSessionRepo.create).toHaveBeenCalled();
    });

    it('should throw USER_ALREADY_EXISTS if email exists', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue({ email: 'existing@test.com' });
      await expect(
        service.register({ email: 'existing@test.com', password: 'pass1234', name: 'Existing' }),
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue({
        _id: { toString: () => 'user1' },
        email: 'user@test.com',
        password: 'hashed-password',
        name: 'User',
        role: 'user',
      });
      mockPasswordService.compare.mockResolvedValue(true);

      const result = await service.login({ email: 'user@test.com', password: 'pass1234' });
      expect(result.user.id).toBe('user1');
      expect(result.accessToken).toBe('access-token');
    });

    it('should throw INVALID_CREDENTIALS if user not found', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'noone@test.com', password: 'pass' }),
      ).rejects.toThrow();
    });

    it('should throw INVALID_CREDENTIALS if password wrong', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue({
        _id: { toString: () => 'user1' },
        email: 'user@test.com',
        password: 'hashed-password',
        name: 'User',
        role: 'user',
      });
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@test.com', password: 'wrong' }),
      ).rejects.toThrow();
    });
  });

  describe('refresh', () => {
    it('should rotate session and return new tokens', async () => {
      const futureDate = new Date(Date.now() + 100000);
      mockSessionRepo.findActiveByUserId.mockResolvedValue([
        {
          _id: { toString: () => 'sess1' },
          refreshToken: 'hashed-refresh-token',
          expiresAt: futureDate,
          isValid: true,
          userId: { toString: () => 'user1' },
        },
      ]);
      mockUsersRepo.findById.mockResolvedValue({
        _id: { toString: () => 'user1' },
        email: 'user@test.com',
        name: 'User',
        role: 'user',
      });

      const result = await service.refresh({ refreshToken: 'plain-refresh-token' });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('plain-refresh-token');
      expect(mockSessionRepo.invalidateSession).toHaveBeenCalledWith('sess1');
    });

    it('should throw INVALID_REFRESH_TOKEN if no matching session', async () => {
      mockSessionRepo.findActiveByUserId.mockResolvedValue([]);
      await expect(
        service.refresh({ refreshToken: 'nonexistent-token' }),
      ).rejects.toThrow();
    });

    it('should throw EXPIRED_REFRESH_TOKEN if session expired', async () => {
      const pastDate = new Date(Date.now() - 100000);
      mockSessionRepo.findActiveByUserId.mockResolvedValue([
        {
          _id: { toString: () => 'sess1' },
          refreshToken: 'hashed-refresh-token',
          expiresAt: pastDate,
          isValid: true,
          userId: { toString: () => 'user1' },
        },
      ]);

      await expect(
        service.refresh({ refreshToken: 'plain-refresh-token' }),
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should invalidate session and return success', async () => {
      mockSessionRepo.findActiveByUserId.mockResolvedValue([
        {
          _id: { toString: () => 'sess1' },
          refreshToken: 'hashed-refresh-token',
        },
      ]);

      const result = await service.logout({ refreshToken: 'plain-refresh-token' });
      expect(result.message).toBe('Logged out successfully');
      expect(mockSessionRepo.invalidateSession).toHaveBeenCalledWith('sess1');
    });

    it('should return success even if no session found (idempotent)', async () => {
      mockSessionRepo.findActiveByUserId.mockResolvedValue([]);
      const result = await service.logout({ refreshToken: 'nonexistent' });
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      mockUsersRepo.findById.mockResolvedValue({
        _id: { toString: () => 'user1' },
        email: 'user@test.com',
        name: 'User',
        role: 'user',
        createdAt: new Date('2024-01-01'),
      });

      const result = await service.getMe('user1');
      expect(result.id).toBe('user1');
      expect(result.email).toBe('user@test.com');
    });

    it('should throw if user not found', async () => {
      mockUsersRepo.findById.mockResolvedValue(null);
      await expect(service.getMe('nonexistent')).rejects.toThrow();
    });
  });
});
