import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseWrapperInterceptor } from './interceptors/response-wrapper.interceptor';
import { QueryService } from './repository/query.service';
import configuration from '../config/configuration';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        skipIf: (context: ExecutionContext) => context.getType() !== 'http',
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('config.throttle.ttl'),
            limit: configService.get<number>('config.throttle.limit'),
          },
        ],
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('config.auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<string>('config.auth.accessTokenExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    QueryService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [JwtModule, QueryService],
})
export class CoreModule {}
