import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSession, UserSessionSchema } from './schemas/user-session.schema';
import { UserSessionRepository } from './repositories/user-session.repository';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema }]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserSessionRepository],
  exports: [AuthService, UserSessionRepository],
})
export class AuthModule {}
