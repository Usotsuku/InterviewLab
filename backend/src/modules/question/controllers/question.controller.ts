import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { QuestionService } from '../services/question.service';

@ApiTags('Questions')
@Controller('questions')
export class QuestionController {
  constructor(private readonly _questionService: QuestionService) {}

  @Get('interview/:interviewId')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve generated questions for a session.' })
  async getByInterview(
    @CurrentUser() user: JwtPayload,
    @Param('interviewId') interviewId: string,
  ) {
    return this._questionService.getQuestionsForSession(interviewId, user.sub);
  }
}
