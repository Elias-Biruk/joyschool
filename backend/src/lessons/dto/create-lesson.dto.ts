import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { LessonType } from '@prisma/client';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  content: string;

  @IsEnum(LessonType)
  type: LessonType;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  codeExample?: string;

  @IsOptional()
  resources?: any;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsString()
  moduleId: string;

  @IsNumber()
  order: number;
}
