import { Controller, Post, Get, Param, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { InterviewService } from '../services/interview.service';
import { CreateInterviewDto } from '../dto/create-interview.dto';

@ApiTags('Interviews')
@Controller('interviews')
export class InterviewController {
  constructor(private readonly _interviewService: InterviewService) {}

  @Post()
  @CheckAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new interview preparation session.' })
  async create(@CurrentUser() user: JwtPayload, @Body() body: CreateInterviewDto) {
    return this._interviewService.createSession(user.sub, body);
  }

  @Get(':id/start')
  @CheckAuth()
  @ApiOperation({ summary: 'Transition an interview state to IN_PROGRESS.' })
  async start(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._interviewService.startSession(user.sub, id);
  }

  @Get(':id')
  @CheckAuth()
  @ApiOperation({ summary: 'Retrieve session specifications and aggregated metrics report.' })
  async getDetails(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this._interviewService.getSessionDetails(user.sub, id);
  }
}
