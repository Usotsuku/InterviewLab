import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoreModule } from '@core/core.module';
import { AppController } from './app.controller';

// Domain Modules
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { CandidateProfileModule } from '@modules/candidate-profile/candidate-profile.module';
import { CvModule } from '@modules/cv/cv.module';
import { InterviewModule } from '@modules/interview/interview.module';
import { QuestionModule } from '@modules/question/question.module';
import { AnswerModule } from '@modules/answer/answer.module';
import { MetricsModule } from '@modules/metrics/metrics.module';
import { SpeechModule } from '@modules/speech/speech.module';
import { AIModule } from '@modules/ai/ai.module';
import { StorageModule } from '@modules/storage/storage.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { SettingsModule } from '@modules/settings/settings.module';

@Module({
  imports: [
    CoreModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('config.database.uri'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CandidateProfileModule,
    CvModule,
    InterviewModule,
    QuestionModule,
    AnswerModule,
    MetricsModule,
    SpeechModule,
    AIModule,
    StorageModule,
    NotificationModule,
    SettingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
