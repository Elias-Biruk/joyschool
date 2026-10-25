import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  courseId: string;

  @IsNumber()
  order: number;
}
