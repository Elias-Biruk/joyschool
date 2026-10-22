import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async createAssignment(createAssignmentDto: CreateAssignmentDto, teacherId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: createAssignmentDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to create assignments for this course');
    }

    return this.prisma.assignment.create({
      data: {
        ...createAssignmentDto,
        dueDate: createAssignmentDto.dueDate ? new Date(createAssignmentDto.dueDate) : null,
      },
    });
  }

  async getAssignmentById(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }

  async getAssignmentsByCourse(courseId: string) {
    return this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async submitAssignment(submitAssignmentDto: SubmitAssignmentDto, userId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: submitAssignmentDto.assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if user is enrolled in the course
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: assignment.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to submit assignments');
    }

    // Check if already submitted
    const existingSubmission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: assignment.id,
        userId,
      },
    });

    if (existingSubmission) {
      throw new ForbiddenException('You have already submitted this assignment');
    }

    // Check if late submission
    let isLate = false;
    if (assignment.dueDate && !assignment.allowLateSubmission) {
      isLate = new Date() > assignment.dueDate;
      if (isLate) {
        throw new ForbiddenException('Late submissions are not allowed for this assignment');
      }
    }

    return this.prisma.assignmentSubmission.create({
      data: {
        assignmentId: assignment.id,
        userId,
        content: submitAssignmentDto.content,
        fileUrl: submitAssignmentDto.fileUrl,
        isLate,
      },
    });
  }

  async gradeAssignment(gradeAssignmentDto: GradeAssignmentDto, teacherId: string) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: gradeAssignmentDto.submissionId },
      include: {
        assignment: {
          include: { course: true },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.assignment.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to grade this submission');
    }

    // Validate grade doesn't exceed max points
    if (gradeAssignmentDto.grade > submission.assignment.maxPoints) {
      throw new ForbiddenException('Grade cannot exceed maximum points for this assignment');
    }

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: {
        grade: gradeAssignmentDto.grade,
        feedback: gradeAssignmentDto.feedback,
        gradedAt: new Date(),
      },
    });

    return updated;
  }

  async getAssignmentSubmissions(assignmentId: string, teacherId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to view submissions for this assignment');
    }

    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        feedbacks: {
          include: {
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getMySubmissions(userId: string) {
    return this.prisma.assignmentSubmission.findMany({
      where: { userId },
      include: {
        assignment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        feedbacks: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async deleteAssignment(id: string, teacherId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to delete this assignment');
    }

    await this.prisma.assignment.delete({
      where: { id },
    });

    return { message: 'Assignment deleted successfully' };
  }
}
