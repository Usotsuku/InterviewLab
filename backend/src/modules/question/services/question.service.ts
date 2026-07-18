import { Injectable, Logger } from '@nestjs/common';
import { QuestionRepository } from '../repositories/question.repository';
import { Types } from 'mongoose';

interface QuestionResponse {
  id: string;
  interviewId: string;
  order: number;
  text: string;
  type: string;
  difficulty: string;
}

@Injectable()
export class QuestionService {
  private readonly _logger = new Logger(QuestionService.name);

  constructor(private readonly _questionRepo: QuestionRepository) {}

  async getQuestionsForSession(interviewId: string): Promise<QuestionResponse[]> {
    const questions = await this._questionRepo.findByInterviewId(interviewId);

    return questions.map((doc) => {
      const typed = doc as unknown as {
        _id: Types.ObjectId;
        interviewId: Types.ObjectId;
        order: number;
        text: string;
        type: string;
        difficulty: string;
      };

      return {
        id: typed._id.toString(),
        interviewId: typed.interviewId.toString(),
        order: typed.order,
        text: typed.text,
        type: typed.type,
        difficulty: typed.difficulty,
      };
    });
  }
}
