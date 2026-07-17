import { Injectable } from '@nestjs/common';
import { CreateInterviewDto } from '../dto/create-interview.dto';
import { InterviewMode, InterviewStatus } from '@shared/enums/domain.enums';

interface InterviewSessionResponse {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  createdAt: string;
}

interface InterviewStartResponse {
  id: string;
  userId: string;
  status: InterviewStatus;
  startedAt: string;
}

interface InterviewDetailsResponse {
  id: string;
  userId: string;
  status: InterviewStatus;
  mode: string;
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
}

interface AdvanceResponse {
  interviewId: string;
  advanced: true;
}

@Injectable()
export class InterviewService {
  async createSession(userId: string, _dto: CreateInterviewDto): Promise<InterviewSessionResponse> {
    // TODO: implement session creation logic
    return {
      id: 'mock_interview_id',
      userId,
      mode: _dto.mode || InterviewMode.TECHNICAL,
      status: InterviewStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
  }

  async startSession(userId: string, interviewId: string): Promise<InterviewStartResponse> {
    // TODO: implement session starting logic
    return {
      id: interviewId,
      userId,
      status: InterviewStatus.IN_PROGRESS,
      startedAt: new Date().toISOString(),
    };
  }

  async getSessionDetails(userId: string, interviewId: string): Promise<InterviewDetailsResponse> {
    // TODO: retrieve details from repository
    return {
      id: interviewId,
      userId,
      status: InterviewStatus.COMPLETED,
      mode: 'Technical',
      overallScore: 84,
      communicationScore: 82,
      technicalScore: 85,
      confidenceScore: 80,
    };
  }

  async advanceQuestion(interviewId: string): Promise<AdvanceResponse> {
    // TODO: advance question index
    return { interviewId, advanced: true };
  }
}
