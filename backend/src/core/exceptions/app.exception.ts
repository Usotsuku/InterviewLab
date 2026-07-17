import { HttpException } from '@nestjs/common';

export interface IAppException {
  message: string;
  statusCode: number;
  description?: string;
}

export class AppException extends HttpException {
  constructor(
    public readonly errorDef: IAppException,
    public readonly details?: unknown,
  ) {
    super(errorDef.message, errorDef.statusCode);
  }

  static throw(errorDef: IAppException, details?: unknown): never {
    throw new AppException(errorDef, details);
  }
}
