import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ReorderLessonDto } from './dto/reorder-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('v1/lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.lessonsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post()
  async create(@Body() createLessonDto: CreateLessonDto, @Request() req: RequestWithUser) {
    return this.lessonsService.create(createLessonDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Request() req: RequestWithUser,
  ) {
    return this.lessonsService.update(id, updateLessonDto, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.lessonsService.remove(id, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post('reorder')
  async reorder(@Body() reorderLessonDto: ReorderLessonDto, @Request() req: RequestWithUser) {
    return this.lessonsService.reorder(reorderLessonDto, req.user.userId, req.user.role);
  }
}
