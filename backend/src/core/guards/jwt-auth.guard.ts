import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { AppException } from '../exceptions/app.exception';
import { CORE_ERRORS } from '../exceptions/core.errors';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly _jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: JwtPayload }>();
    const token = this._extractTokenFromHeader(request);

    if (!token) {
      AppException.throw(CORE_ERRORS.UNAUTHORIZED);
    }

    try {
      const payload = await this._jwtService.verifyAsync(token);
      request.user = payload;
    } catch {
      AppException.throw(CORE_ERRORS.UNAUTHORIZED);
    }

    return true;
  }

  private _extractTokenFromHeader(request: FastifyRequest): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
