import { Injectable } from '@nestjs/common';

@Injectable()
export class RateLimitService {
  private readonly _limits = new Map<string, { count: number; resetTime: number }>();

  async isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const entry = this._limits.get(key);

    if (!entry || now > entry.resetTime) {
      this._limits.set(key, { count: 1, resetTime: now + windowMs });
      return false;
    }

    entry.count += 1;
    return entry.count > limit;
  }
}
