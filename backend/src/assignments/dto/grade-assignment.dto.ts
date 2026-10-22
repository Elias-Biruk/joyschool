import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class GradeAssignmentDto {
  @IsString()
  @IsNotEmpty()
  submissionId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  grade: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}
