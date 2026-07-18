import { Module } from '@nestjs/common';
import { CvController } from './controllers/cv.controller';
import { CvService } from './services/cv.service';
import { PdfExtractionService } from './services/pdf-extraction.service';
import { CvAnalysisService } from './services/cv-analysis.service';
import { StorageModule } from '@modules/storage/storage.module';
import { CandidateProfileModule } from '@modules/candidate-profile/candidate-profile.module';
import { AIModule } from '@modules/ai/ai.module';
import { NotificationModule } from '@modules/notification/notification.module';

@Module({
  imports: [StorageModule, CandidateProfileModule, AIModule, NotificationModule],
  controllers: [CvController],
  providers: [CvService, PdfExtractionService, CvAnalysisService],
  exports: [CvService],
})
export class CvModule {}
