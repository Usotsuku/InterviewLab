import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { InterviewMode } from '@shared/enums/domain.enums';

export class CreateInterviewDto {
  @ApiProperty({ enum: InterviewMode, example: InterviewMode.TECHNICAL })
  @IsEnum(InterviewMode)
  @IsNotEmpty()
  mode!: InterviewMode;
}
