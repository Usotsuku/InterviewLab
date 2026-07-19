import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSession, UserSessionSchema } from './schemas/user-session.schema';
import { UserSessionRepository } from './repositories/user-session.repository';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthConfig } from '@core/config/auth.config';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema }]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    JwtStrategy,
    UserSessionRepository,
    AuthConfig,
  ],
  exports: [AuthService, JwtStrategy, AuthConfig, UserSessionRepository],
})
export class AuthModule {}
