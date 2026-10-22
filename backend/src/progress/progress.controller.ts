import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('v1/progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Post()
  async createOrUpdate(@Body() createProgressDto: CreateProgressDto, @Request() req: RequestWithUser) {
    return this.progressService.createOrUpdate(createProgressDto, req.user.userId);
  }

  @Get()
  async findMyProgress(@Request() req: RequestWithUser, @Query('courseId') courseId?: string) {
    return this.progressService.findUserProgress(req.user.userId, courseId);
  }

  @Get('lesson/:lessonId')
  async findLessonProgress(@Param('lessonId') lessonId: string, @Request() req: RequestWithUser) {
    return this.progressService.findLessonProgress(req.user.userId, lessonId);
  }

  @Get('course/:courseId')
  async getCourseProgress(@Param('courseId') courseId: string, @Request() req: RequestWithUser) {
    return this.progressService.getCourseProgress(req.user.userId, courseId);
  }
}
