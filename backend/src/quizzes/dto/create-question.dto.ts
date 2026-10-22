import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  CODING = 'CODING',
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  type: QuestionType;

  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsString()
  @IsOptional()
  codeTemplate?: string;

  @IsString()
  @IsOptional()
  expectedOutput?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  points?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  order?: number;
}
