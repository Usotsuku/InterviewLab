import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Question ID being answered' })
  @IsMongoId()
  @IsNotEmpty()
  questionId!: string;

  @ApiPropertyOptional({ example: 'I have five years of experience in...' })
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Base64 audio blob', format: 'binary' })
  @IsOptional()
  @IsString()
  audioBlob?: string;
}
