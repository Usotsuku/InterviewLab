import { Controller, Post, Param, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { AnswerService } from '../services/answer.service';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';

@ApiTags('Answers')
@Controller('interviews/:interviewId/answers')
export class AnswerController {
  constructor(private readonly _answerService: AnswerService) {}

  @Post()
  @CheckAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an answer, transcribing and triggering analysis.' })
  async submitAnswer(
    @CurrentUser() user: JwtPayload,
    @Param('interviewId') interviewId: string,
    @Body() body: SubmitAnswerDto,
  ) {
    return this._answerService.submit(user.sub, interviewId, body);
  }
}
