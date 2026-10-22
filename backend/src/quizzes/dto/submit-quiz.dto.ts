import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsArray()
  @IsNotEmpty()
  answers: QuizAnswerDto[];
}

export class QuizAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @IsString()
  @IsOptional()
  codeAnswer?: string;
}
