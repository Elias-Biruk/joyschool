import { IsArray, IsString } from 'class-validator';

export class ReorderLessonDto {
  @IsArray()
  @IsString({ each: true })
  lessonIds: string[];
}
