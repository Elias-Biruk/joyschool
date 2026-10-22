import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsOptional()
  moduleId?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  timeLimitMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxAttempts?: number;

  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}
