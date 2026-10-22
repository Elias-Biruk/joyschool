import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('v1/courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Public()
  @Get()
  async findAll(@Query() query: QueryCourseDto) {
    return this.coursesService.findAll(query);
  }

  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post()
  async create(@Body() createCourseDto: CreateCourseDto, @Request() req: RequestWithUser) {
    return this.coursesService.create(createCourseDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('teacher/my-courses')
  async findMyCourses(@Request() req: RequestWithUser, @Query() query: QueryCourseDto) {
    return this.coursesService.findTeacherCourses(req.user.userId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req: RequestWithUser,
  ) {
    return this.coursesService.update(id, updateCourseDto, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.coursesService.remove(id, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post(':id/publish')
  async publish(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.coursesService.publish(id, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.coursesService.unpublish(id, req.user.userId, req.user.role);
  }
}
