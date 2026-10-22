import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';
import { IsEnum } from 'class-validator';
import { CourseStatus } from '@prisma/client';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
