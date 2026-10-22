import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitAssignmentDto {
  @IsString()
  @IsNotEmpty()
  assignmentId: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;
}
