import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { AppException } from '../exceptions/app.exception';
import { CORE_ERRORS } from '../exceptions/core.errors';
import { JwtPayload } from '../decorators/current-user.decorator';
import { UserSessionRepository } from '@modules/auth/repositories/user-session.repository';

export const IS_PUBLIC_KEY = 'is_public';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly _reflector: Reflector,
    private readonly _jwtService: JwtService,
    private readonly _sessionRepository: UserSessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: JwtPayload }>();
    const token = this._extractTokenFromHeader(request);

    if (!token) {
      AppException.throw(CORE_ERRORS.UNAUTHORIZED);
    }

    let payload: JwtPayload;
    try {
      payload = await this._jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      AppException.throw(CORE_ERRORS.UNAUTHORIZED);
    }

    if (!payload.sessionId) {
      AppException.throw(CORE_ERRORS.UNAUTHORIZED);
    }

    const session = await this._sessionRepository.findById(payload.sessionId);
    if (!session) {
      AppException.throw(CORE_ERRORS.UNAUTHORIZED);
    }

    const typed = session as unknown as { isValid: boolean; expiresAt: Date };
    if (!typed.isValid || new Date() > typed.expiresAt) {
      AppException.throw(CORE_ERRORS.UNAUTHORIZED);
    }

    request.user = payload;
    return true;
  }

  private _extractTokenFromHeader(request: FastifyRequest): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
