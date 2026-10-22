import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentStatus } from '@prisma/client';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createEnrollmentDto: CreateEnrollmentDto, userId: string) {
    // Check if course exists and is published
    const course = await this.prisma.course.findUnique({
      where: { id: createEnrollmentDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.status !== 'PUBLISHED') {
      throw new ForbiddenException('Course is not available for enrollment');
    }

    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: createEnrollmentDto.courseId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }

    return this.prisma.enrollment.create({
      data: {
        userId,
        courseId: createEnrollmentDto.courseId,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        course: {
          include: {
            category: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async findUserEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async findCourseEnrollments(courseId: string, teacherId: string, userRole: string) {
    // Verify course ownership
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacherId !== teacherId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to view enrollments for this course');
    }

    return this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            category: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Check authorization
    if (enrollment.userId !== userId && userRole !== 'ADMIN' && userRole !== 'TEACHER') {
      throw new ForbiddenException('Not authorized to view this enrollment');
    }

    return enrollment;
  }

  async updateProgress(enrollmentId: string, progressPercent: number) {
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercent,
        completedAt: progressPercent >= 100 ? new Date() : null,
        status: progressPercent >= 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
      },
    });
  }

  async remove(id: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this enrollment');
    }

    await this.prisma.enrollment.delete({
      where: { id },
    });

    return { message: 'Enrollment deleted successfully' };
  }
}
