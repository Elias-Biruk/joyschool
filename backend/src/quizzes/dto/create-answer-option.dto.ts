import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateAnswerOptionDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  @IsNotEmpty()
  isCorrect: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  order?: number;
}
