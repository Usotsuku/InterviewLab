import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ExperienceEntryDto {
  @ApiPropertyOptional({ example: 'Tech Corp' })
  @IsString()
  @IsNotEmpty()
  company!: string;

  @ApiPropertyOptional({ example: 'Senior Developer' })
  @IsString()
  @IsNotEmpty()
  position!: string;

  @ApiPropertyOptional({ example: '2020-01-15' })
  startDate!: string | Date;

  @ApiPropertyOptional({ example: '2023-06-30' })
  @IsOptional()
  endDate?: string | Date;

  @ApiPropertyOptional({ example: 'Led a team of 5 developers.' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProjectEntryDto {
  @ApiPropertyOptional({ example: 'E-commerce Platform' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Full-stack web application.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['React', 'Node.js', 'MongoDB'] })
  @IsArray()
  @IsString({ each: true })
  technologies!: string[];

  @ApiPropertyOptional({ example: 'https://github.com/example/ecommerce' })
  @IsOptional()
  @IsString()
  url?: string;
}

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

  @ApiPropertyOptional({ type: [ExperienceEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceEntryDto)
  experience?: ExperienceEntryDto[];

  @ApiPropertyOptional({ type: [ProjectEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectEntryDto)
  projects?: ProjectEntryDto[];

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
