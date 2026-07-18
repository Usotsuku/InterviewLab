import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AppException } from './app.exception';
import { CORE_ERRORS } from './core.errors';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly _logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = CORE_ERRORS.INTERNAL_SERVER_ERROR.message;
    let details: unknown = null;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      message = exception.errorDef.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent = exception.getResponse();
      message =
        typeof resContent === 'string'
          ? resContent
          : (resContent as { message?: string }).message || exception.message;
    } else if (exception instanceof Error) {
      // General database errors, mongo exceptions, etc.
      const errName = exception.name;
      if (errName === 'ValidationError' || errName === 'MongoServerError') {
        status = HttpStatus.BAD_REQUEST;
        message = CORE_ERRORS.VALIDATION_ERROR.message;
        details = null;
      } else {
        this._logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      }
    }

    const requestId = (request.headers['x-request-id'] as string) || `req_${Date.now()}`;

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      details,
      requestId,
    };

    if (status >= 500) {
      this._logger.error(
        `[5XX] ${request.method} ${request.url} - Status: ${status} - Error: ${message} - RequestID: ${requestId}`,
      );
      // Alerting facade trigger (Console Alerting placeholder)
      console.error(`ALERTING TRIGGERED FOR REQUEST ${requestId} - ERROR: ${message}`);
    } else {
      this._logger.warn(
        `[4XX] ${request.method} ${request.url} - Status: ${status} - Warning: ${message}`,
      );
    }

    response.status(status).send(errorResponse);
  }
}
