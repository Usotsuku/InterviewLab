import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthConfig } from '@core/config/auth.config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockAuthConfig = {
    jwtSecret: 'test-secret',
    accessTokenExpiresIn: '15m',
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn().mockResolvedValue('signed-token'),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: AuthConfig, useValue: mockAuthConfig },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verify', () => {
    it('should verify and return decoded payload', async () => {
      const payload = { sub: 'user1', sessionId: 's1', email: 'a@b.com' };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await strategy.verify('valid-token');
      expect(result).toEqual(payload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
    });

    it('should throw on invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));
      await expect(strategy.verify('bad-token')).rejects.toThrow('jwt malformed');
    });
  });

  describe('sign', () => {
    it('should sign a payload and return token', async () => {
      const payload = { sub: 'user1', sessionId: 's1' };
      const token = await strategy.sign(payload);
      expect(token).toBe('signed-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'test-secret',
        expiresIn: '15m',
      });
    });
  });
});
