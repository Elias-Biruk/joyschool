import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  instructions: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsOptional()
  moduleId?: string;

  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  maxPoints: number;

  @IsBoolean()
  @IsOptional()
  allowLateSubmission?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}
