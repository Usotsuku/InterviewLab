import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import { AuthConfig } from '@core/config/auth.config';

describe('PasswordService', () => {
  let service: PasswordService;

  const mockAuthConfig = {
    bcryptRounds: 4,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        { provide: AuthConfig, useValue: mockAuthConfig },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should hash a plain string', async () => {
    const hash = await service.hash('testpassword');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('testpassword');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should return true for matching password', async () => {
    const hash = await service.hash('mypassword');
    const result = await service.compare('mypassword', hash);
    expect(result).toBe(true);
  });

  it('should return false for non-matching password', async () => {
    const hash = await service.hash('mypassword');
    const result = await service.compare('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('should produce different hashes for same input (salt)', async () => {
    const hash1 = await service.hash('samepassword');
    const hash2 = await service.hash('samepassword');
    expect(hash1).not.toBe(hash2);
  });

  it('should handle async input', async () => {
    const promise = Promise.resolve('asyncpassword');
    const hash = await service.hash(promise);
    const result = await service.compare('asyncpassword', hash);
    expect(result).toBe(true);
  });
});
