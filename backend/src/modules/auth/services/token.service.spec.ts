import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { AuthConfig } from '@core/config/auth.config';

describe('TokenService', () => {
  let service: TokenService;

  const mockAuthConfig = {
    jwtSecret: 'test-secret-key',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
    refreshTokenByteLength: 48,
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-access-token'),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: AuthConfig, useValue: mockAuthConfig },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should sign a JWT payload and return token', async () => {
      const payload = { sub: 'user123', sessionId: 'sess123', email: 'test@test.com' };
      const token = await service.generateAccessToken(payload);
      expect(token).toBe('mock-access-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'test-secret-key',
        expiresIn: '15m',
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should return a hex string of correct length', () => {
      const token = service.generateRefreshToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(96);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens each call', () => {
      const token1 = service.generateRefreshToken();
      const token2 = service.generateRefreshToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashRefreshToken', () => {
    it('should return a sha256 hash', () => {
      const token = 'plain-refresh-token';
      const hash = service.hashRefreshToken(token);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64);
    });

    it('should produce same hash for same input', () => {
      const hash1 = service.hashRefreshToken('same-token');
      const hash2 = service.hashRefreshToken('same-token');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', () => {
      const hash1 = service.hashRefreshToken('token-a');
      const hash2 = service.hashRefreshToken('token-b');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('parseRefreshTokenExpiry', () => {
    it('should parse days correctly', () => {
      expect(service.parseRefreshTokenExpiry()).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });
});
