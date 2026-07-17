import { Injectable } from '@nestjs/common';

interface QuestionResponse {
  id: string;
  interviewId: string;
  order: number;
  text: string;
  type: string;
}

@Injectable()
export class QuestionService {
  async getQuestionsForSession(interviewId: string): Promise<QuestionResponse[]> {
    // TODO: implement repository loading of questions
    return [
      { id: 'q1', interviewId, order: 1, text: 'Tell me about yourself.', type: 'HR' },
      { id: 'q2', interviewId, order: 2, text: 'How does Dependency Injection work in NestJS?', type: 'Technical' },
    ];
  }
}
