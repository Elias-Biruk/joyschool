import { IsString, IsEnum, IsArray, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { CourseLevel } from '@prisma/client';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsEnum(CourseLevel)
  level: CourseLevel;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  durationHours?: number;

  @IsArray()
  @IsString({ each: true })
  prerequisites: string[];

  @IsArray()
  @IsString({ each: true })
  learningObjectives: string[];
}
