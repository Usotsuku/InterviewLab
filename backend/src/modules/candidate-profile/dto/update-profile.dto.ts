import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Experienced full-stack developer...' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: ['TypeScript', 'NestJS', 'Angular'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: ['MongoDB', 'TailwindCSS'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({ example: ['Strong communication', 'Problem solving'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @ApiPropertyOptional({ example: ['Needs more system design experience'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weaknesses?: string[];
}
