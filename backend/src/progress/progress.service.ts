import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdate(createProgressDto: CreateProgressDto, userId: string) {
    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createProgressDto.lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if user is enrolled in the course
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    // Check if progress already exists
    const existing = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId: createProgressDto.lessonId,
        },
      },
    });

    if (existing) {
      // Update existing progress
      const updated = await this.prisma.lessonProgress.update({
        where: { id: existing.id },
        data: {
          completed: createProgressDto.completed,
          completedAt: createProgressDto.completed ? new Date() : null,
          timeSpentMinutes: existing.timeSpentMinutes + createProgressDto.timeSpentMinutes,
        },
      });

      // Update course progress
      await this.updateCourseProgress(enrollment.id, lesson.module.courseId, userId);

      return updated;
    }

    // Create new progress
    const progress = await this.prisma.lessonProgress.create({
      data: {
        userId,
        lessonId: createProgressDto.lessonId,
        completed: createProgressDto.completed,
        completedAt: createProgressDto.completed ? new Date() : null,
        timeSpentMinutes: createProgressDto.timeSpentMinutes,
      },
    });

    // Update course progress
    await this.updateCourseProgress(enrollment.id, lesson.module.courseId, userId);

    return progress;
  }

  async findUserProgress(userId: string, courseId?: string) {
    const where: any = { userId };

    if (courseId) {
      const lessonsInCourse = await this.prisma.lesson.findMany({
        where: {
          module: { courseId },
        },
        select: { id: true },
      });

      where.lessonId = {
        in: lessonsInCourse.map((l) => l.id),
      };
    }

    return this.prisma.lessonProgress.findMany({
      where,
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findLessonProgress(userId: string, lessonId: string) {
    return this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      include: {
        lesson: true,
      },
    });
  }

  async getCourseProgress(userId: string, courseId: string) {
    // Verify enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    // Get all lessons in the course
    const lessons = await this.prisma.lesson.findMany({
      where: {
        module: { courseId },
        isRequired: true,
      },
    });

    // Get completed lessons
    const completedLessons = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: {
          module: { courseId },
          isRequired: true,
        },
        completed: true,
      },
    });

    const totalLessons = lessons.length;
    const completedCount = completedLessons.length;
    const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

    return {
      totalLessons,
      completedLessons: completedCount,
      progressPercent: Math.round(progressPercent),
      enrollmentProgress: enrollment.progressPercent,
    };
  }

  private async updateCourseProgress(enrollmentId: string, courseId: string, userId: string) {
    const progress = await this.getCourseProgress(userId, courseId);

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercent: progress.progressPercent,
        completedAt: progress.progressPercent >= 100 ? new Date() : null,
      },
    });
  }
}
