import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { QuestionService } from '../services/question.service';

@ApiTags('Questions')
@Controller('questions')
export class QuestionController {
  constructor(private readonly _questionService: QuestionService) {}

  @Get('interview/:interviewId')
  @CheckAuth()
  @ApiOperation({ summary: 'Retrieve generated questions for a session.' })
  async getByInterview(@Param('interviewId') interviewId: string) {
    return this._questionService.getQuestionsForSession(interviewId);
  }
}
