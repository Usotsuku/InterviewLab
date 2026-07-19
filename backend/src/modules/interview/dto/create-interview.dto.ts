import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { InterviewMode } from '@shared/enums/domain.enums';

export class CreateInterviewDto {
  @ApiProperty({ enum: InterviewMode, example: InterviewMode.TECHNICAL })
  @IsEnum(InterviewMode)
  @IsNotEmpty()
  mode!: InterviewMode;

  @ApiProperty({ example: 5, default: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  questionCount?: number;
}
