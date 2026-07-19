import { Test, TestingModule } from '@nestjs/testing';
import { RetryService } from './retry.service';

describe('RetryService', () => {
  let service: RetryService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetryService],
    }).compile();

    service = module.get<RetryService>(RetryService);
  });

  describe('execute', () => {
    it('should return result on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await service.execute(fn, {
        maxAttempts: 3,
        baseDelayMs: 10,
        maxDelayMs: 100,
        operationName: 'test',
      });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed on second attempt', async () => {
      const fn = jest.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('success');
      const result = await service.execute(fn, {
        maxAttempts: 3,
        baseDelayMs: 10,
        maxDelayMs: 100,
        operationName: 'retry-test',
      });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should exhaust all attempts and throw', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('persistent failure'));
      await expect(
        service.execute(fn, {
          maxAttempts: 2,
          baseDelayMs: 10,
          maxDelayMs: 100,
          operationName: 'fail-test',
        }),
      ).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should calculate exponential backoff delay', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('1'))
        .mockRejectedValueOnce(new Error('2'))
        .mockResolvedValue('ok');

      const start = Date.now();
      await service.execute(fn, {
        maxAttempts: 3,
        baseDelayMs: 50,
        maxDelayMs: 500,
        operationName: 'backoff-test',
      });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it('should not retry non-retryable errors (401)', async () => {
      const error = Object.assign(new Error('Unauthorized'), { status: 401 });
      const fn = jest.fn().mockRejectedValue(error);
      await expect(
        service.execute(fn, {
          maxAttempts: 3,
          baseDelayMs: 10,
          maxDelayMs: 100,
          operationName: 'non-retryable',
        }),
      ).rejects.toThrow('Unauthorized');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry non-retryable errors (404)', async () => {
      const error = Object.assign(new Error('Not found'), { status: 404 });
      const fn = jest.fn().mockRejectedValue(error);
      await expect(
        service.execute(fn, {
          maxAttempts: 3,
          baseDelayMs: 10,
          maxDelayMs: 100,
          operationName: 'non-retryable-404',
        }),
      ).rejects.toThrow('Not found');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
