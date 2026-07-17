import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from '../dto/update-profile.dto';

interface CandidateProfileResponse {
  userId: string;
  summary: string;
  skills: string[];
  technologies: string[];
  experience: never[];
  projects: never[];
  strengths: string[];
  weaknesses: string[];
}

@Injectable()
export class CandidateProfileService {
  async findByUserId(userId: string): Promise<CandidateProfileResponse> {
    // TODO: implement profile reading
    return {
      userId,
      summary: 'TODO: summary of candidate',
      skills: ['TypeScript', 'NestJS', 'Angular'],
      technologies: ['MongoDB', 'TailwindCSS'],
      experience: [],
      projects: [],
      strengths: [],
      weaknesses: [],
    };
  }

  async updateByUserId(userId: string, _data: UpdateProfileDto): Promise<{ userId: string; updated: true }> {
    // TODO: implement updating profile
    return { userId, updated: true };
  }
}
