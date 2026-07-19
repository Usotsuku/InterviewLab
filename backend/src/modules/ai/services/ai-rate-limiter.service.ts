import { Injectable, Logger } from '@nestjs/common';
import { AppException } from '@core/exceptions/app.exception';
import { AI_ERRORS } from '../errors/ai.errors';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

@Injectable()
export class AiRateLimiterService {
  private readonly _logger = new Logger(AiRateLimiterService.name);
  private readonly _userLimits = new Map<string, RateLimitEntry>();

  private static readonly INTERVIEW_GEN_MAX = 10;
  private static readonly INTERVIEW_GEN_WINDOW_MS = 60 * 60 * 1000;
  private static readonly CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

  private _lastCleanup = Date.now();

  checkInterviewGeneration(userId: string): void {
    this._maybeCleanup();

    const now = Date.now();
    const entry = this._userLimits.get(userId);

    if (!entry || now - entry.windowStart > AiRateLimiterService.INTERVIEW_GEN_WINDOW_MS) {
      this._userLimits.set(userId, { count: 1, windowStart: now });
      return;
    }

    entry.count++;

    if (entry.count > AiRateLimiterService.INTERVIEW_GEN_MAX) {
      this._logger.warn(
        `[checkInterviewGeneration] User ${userId} exceeded rate limit: ${entry.count} requests in window`,
      );
      AppException.throw(AI_ERRORS.RATE_LIMIT_EXCEEDED);
    }
  }

  private _maybeCleanup(): void {
    const now = Date.now();
    if (now - this._lastCleanup < AiRateLimiterService.CLEANUP_INTERVAL_MS) {
      return;
    }
    this._lastCleanup = now;

    for (const [userId, entry] of this._userLimits) {
      if (now - entry.windowStart > AiRateLimiterService.INTERVIEW_GEN_WINDOW_MS) {
        this._userLimits.delete(userId);
      }
    }
  }
}
