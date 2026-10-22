import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerOptionDto } from './dto/create-answer-option.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeacherGuard } from '../auth/guards/teacher.guard';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@Controller('v1/quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @UseGuards(TeacherGuard)
  async createQuiz(@Body() createQuizDto: CreateQuizDto, @Request() req: RequestWithUser) {
    return this.quizzesService.createQuiz(createQuizDto, req.user.userId);
  }

  @Get(':id')
  async getQuizById(@Param('id') id: string) {
    return this.quizzesService.getQuizById(id);
  }

  @Get('course/:courseId')
  async getQuizzesByCourse(@Param('courseId') courseId: string) {
    return this.quizzesService.getQuizzesByCourse(courseId);
  }

  @Post('questions')
  @UseGuards(TeacherGuard)
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto, @Request() req: RequestWithUser) {
    return this.quizzesService.createQuestion(createQuestionDto, req.user.userId);
  }

  @Post('answer-options')
  @UseGuards(TeacherGuard)
  async createAnswerOption(@Body() createAnswerOptionDto: CreateAnswerOptionDto, @Request() req: RequestWithUser) {
    return this.quizzesService.createAnswerOption(createAnswerOptionDto, req.user.userId);
  }

  @Post('submit')
  async submitQuiz(@Body() submitQuizDto: SubmitQuizDto, @Request() req: RequestWithUser) {
    return this.quizzesService.submitQuiz(submitQuizDto, req.user.userId);
  }

  @Get(':id/attempts')
  async getQuizAttempts(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.quizzesService.getQuizAttempts(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(TeacherGuard)
  async deleteQuiz(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.quizzesService.deleteQuiz(id, req.user.userId);
  }
}
