import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('v1/enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post()
  async create(@Body() createEnrollmentDto: CreateEnrollmentDto, @Request() req: RequestWithUser) {
    return this.enrollmentsService.create(createEnrollmentDto, req.user.userId);
  }

  @Get('my-enrollments')
  async findMyEnrollments(@Request() req: RequestWithUser) {
    return this.enrollmentsService.findUserEnrollments(req.user.userId);
  }

  @Get('course/:courseId')
  async findCourseEnrollments(@Param('courseId') courseId: string, @Request() req: RequestWithUser) {
    return this.enrollmentsService.findCourseEnrollments(courseId, req.user.userId, req.user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.enrollmentsService.findOne(id, req.user.userId, req.user.role);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.enrollmentsService.remove(id, req.user.userId);
  }
}
