import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeacherGuard } from '../auth/guards/teacher.guard';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@Controller('v1/assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @UseGuards(TeacherGuard)
  async createAssignment(@Body() createAssignmentDto: CreateAssignmentDto, @Request() req: RequestWithUser) {
    return this.assignmentsService.createAssignment(createAssignmentDto, req.user.userId);
  }

  @Get(':id')
  async getAssignmentById(@Param('id') id: string) {
    return this.assignmentsService.getAssignmentById(id);
  }

  @Get('course/:courseId')
  async getAssignmentsByCourse(@Param('courseId') courseId: string) {
    return this.assignmentsService.getAssignmentsByCourse(courseId);
  }

  @Post('submit')
  async submitAssignment(@Body() submitAssignmentDto: SubmitAssignmentDto, @Request() req: RequestWithUser) {
    return this.assignmentsService.submitAssignment(submitAssignmentDto, req.user.userId);
  }

  @Post('grade')
  @UseGuards(TeacherGuard)
  async gradeAssignment(@Body() gradeAssignmentDto: GradeAssignmentDto, @Request() req: RequestWithUser) {
    return this.assignmentsService.gradeAssignment(gradeAssignmentDto, req.user.userId);
  }

  @Get(':id/submissions')
  @UseGuards(TeacherGuard)
  async getAssignmentSubmissions(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.assignmentsService.getAssignmentSubmissions(id, req.user.userId);
  }

  @Get('my/submissions')
  async getMySubmissions(@Request() req: RequestWithUser) {
    return this.assignmentsService.getMySubmissions(req.user.userId);
  }

  @Delete(':id')
  @UseGuards(TeacherGuard)
  async deleteAssignment(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.assignmentsService.deleteAssignment(id, req.user.userId);
  }
}
