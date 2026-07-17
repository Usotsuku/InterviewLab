import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CandidateProfile, CandidateProfileSchema } from './schemas/candidate-profile.schema';
import { CandidateProfileRepository } from './repositories/candidate-profile.repository';
import { CandidateProfileController } from './controllers/candidate-profile.controller';
import { CandidateProfileService } from './services/candidate-profile.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CandidateProfile.name, schema: CandidateProfileSchema }]),
  ],
  controllers: [CandidateProfileController],
  providers: [CandidateProfileService, CandidateProfileRepository],
  exports: [CandidateProfileService, CandidateProfileRepository],
})
export class CandidateProfileModule {}
