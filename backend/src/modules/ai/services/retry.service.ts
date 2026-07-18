import { Injectable, Logger } from '@nestjs/common';
import { AppException } from '@core/exceptions/app.exception';
import { AI_ERRORS } from '../errors/ai.errors';

@Injectable()
export class RetryService {
  private readonly _logger = new Logger(RetryService.name);

  async execute<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts: number;
      baseDelayMs: number;
      maxDelayMs: number;
      operationName: string;
    },
  ): Promise<T> {
    const { maxAttempts, baseDelayMs, maxDelayMs, operationName } = options;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this._logger.log(`[retry] ${operationName} attempt ${attempt}/${maxAttempts}`);
        const result = await fn();
        if (attempt > 1) {
          this._logger.log(`[retry] ${operationName} succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error;
        this._logger.warn(
          `[retry] ${operationName} failed on attempt ${attempt}: ${(error as Error).message}`,
        );

        if (attempt < maxAttempts) {
          const delayMs = this._calculateDelay(attempt, baseDelayMs, maxDelayMs);
          this._logger.log(`[retry] ${operationName} retrying in ${delayMs}ms`);
          await this._sleep(delayMs);
        }
      }
    }

    this._logger.error(`[retry] ${operationName} exhausted ${maxAttempts} attempts`);
    AppException.throw(
      AI_ERRORS.PROVIDER_UNAVAILABLE,
      `All ${maxAttempts} attempts failed for ${operationName}`,
    );
  }

  private _calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * baseDelayMs * 0.1;
    return Math.min(exponentialDelay + jitter, maxDelayMs);
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
