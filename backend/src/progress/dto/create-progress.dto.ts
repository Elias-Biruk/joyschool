import { IsString, IsBoolean, IsNumber } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  lessonId: string;

  @IsBoolean()
  completed: boolean;

  @IsNumber()
  timeSpentMinutes: number;
}
