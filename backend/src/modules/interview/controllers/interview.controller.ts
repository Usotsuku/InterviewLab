import { Controller, Post, Get, Delete, Param, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { InterviewService } from '../services/interview.service';
import { InterviewGenerationService } from '../services/interview-generation.service';
import { InterviewSessionService } from '../services/interview-session.service';
import { InterviewReportService } from '../services/interview-report.service';
import { QuestionService } from '@modules/question/services/question.service';
import { CreateInterviewDto } from '../dto/create-interview.dto';

@ApiTags('Interviews')
@Controller('interviews')
export class InterviewController {
  constructor(
    private readonly _interviewService: InterviewService,
    private readonly _generationService: InterviewGenerationService,
    private readonly _sessionService: InterviewSessionService,
    private readonly _reportService: InterviewReportService,
    private readonly _questionService: QuestionService,
  ) {}

  @Post()
  @CheckAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new interview and generate questions via AI.' })
  @ApiResponse({ status: 201, description: 'Interview created and questions generated.' })
  @ApiResponse({ status: 400, description: 'PROFILE_INCOMPLETE or profile not found.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async create(@CurrentUser() user: JwtPayload, @Body() body: CreateInterviewDto) {
    const interview = await this._interviewService.createInterview(user.sub, body.mode);
    const result = await this._generationService.generate(user.sub, interview.id, body.mode);
    return {
      id: result.interviewId,
      userId: user.sub,
      mode: body.mode,
      status: result.status,
      title: result.title,
      estimatedDuration: result.estimatedDuration,
      totalQuestions: result.totalQuestions,
    };
  }

  @Get()
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all interviews for the authenticated user.' })
  @ApiResponse({ status: 200, description: 'Returns list of interviews.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async list(@CurrentUser() user: JwtPayload) {
    return this._interviewService.getUserInterviews(user.sub);
  }

  @Get(':id')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve interview details.' })
  @ApiResponse({ status: 200, description: 'Returns interview details.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  @ApiResponse({ status: 404, description: 'INTERVIEW_NOT_FOUND' })
  async getDetails(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._interviewService.getInterviewDetails(id, user.sub);
  }

  @Get(':id/start')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start an interview (READY → IN_PROGRESS).' })
  @ApiResponse({ status: 200, description: 'Interview started.' })
  @ApiResponse({ status: 400, description: 'INTERVIEW_NOT_READY or INVALID_STATUS_TRANSITION' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async start(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._sessionService.startInterview(id, user.sub);
  }

  @Get(':id/current-question')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current question during an active interview.' })
  @ApiResponse({ status: 200, description: 'Returns current question.' })
  @ApiResponse({ status: 400, description: 'INTERVIEW_NOT_IN_PROGRESS' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async getCurrentQuestion(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._sessionService.getCurrentQuestion(id, user.sub);
  }

  @Post(':id/next')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Advance to the next question.' })
  @ApiResponse({ status: 200, description: 'Returns next question or completion status.' })
  @ApiResponse({ status: 400, description: 'INTERVIEW_NOT_IN_PROGRESS or ALL_QUESTIONS_ANSWERED' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async nextQuestion(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._sessionService.nextQuestion(id, user.sub);
  }

  @Post(':id/finish')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Finish the interview (IN_PROGRESS → COMPLETED).' })
  @ApiResponse({ status: 200, description: 'Interview completed.' })
  @ApiResponse({ status: 400, description: 'INTERVIEW_NOT_IN_PROGRESS' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async finish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._sessionService.finishInterview(id, user.sub);
  }

  @Get(':id/questions')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve all questions for an interview.' })
  @ApiResponse({ status: 200, description: 'Returns list of questions.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async getQuestions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this._interviewService.assertOwnedBy(id, user.sub);
    return this._questionService.getQuestionsForSession(id);
  }

  @Get(':id/report')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve the full interview report with questions, metrics, and AI evaluations.',
  })
  @ApiResponse({ status: 200, description: 'Returns the interview report.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  @ApiResponse({ status: 404, description: 'INTERVIEW_NOT_FOUND' })
  async getReport(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._reportService.getReport(id, user.sub);
  }

  @Delete(':id')
  @CheckAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an interview.' })
  @ApiResponse({ status: 200, description: 'Interview deleted.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._interviewService.deleteInterview(id, user.sub);
  }
}
