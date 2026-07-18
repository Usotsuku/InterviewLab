import { Module } from '@nestjs/common';
import { CvController } from './controllers/cv.controller';
import { CvService } from './services/cv.service';
import { PdfExtractionService } from './services/pdf-extraction.service';
import { StorageModule } from '@modules/storage/storage.module';
import { CandidateProfileModule } from '@modules/candidate-profile/candidate-profile.module';

@Module({
  imports: [StorageModule, CandidateProfileModule],
  controllers: [CvController],
  providers: [CvService, PdfExtractionService],
  exports: [CvService],
})
export class CvModule {}
