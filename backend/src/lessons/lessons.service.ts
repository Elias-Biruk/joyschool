import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async create(createLessonDto: CreateLessonDto, teacherId: string) {
    // Verify module exists and user owns it
    const module = await this.prisma.courseModule.findUnique({
      where: { id: createLessonDto.moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    if (module.course.teacherId !== teacherId) {
      throw new ForbiddenException('Not authorized to add lessons to this module');
    }

    return this.prisma.lesson.create({
      data: createLessonDto,
    });
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {
              include: {
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
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async findBySlug(slug: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { slug },
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

    return lesson;
  }

  async update(id: string, updateLessonDto: UpdateLessonDto, teacherId: string, userRole: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check ownership or admin access
    if (lesson.module.course.teacherId !== teacherId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to update this lesson');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: updateLessonDto,
    });
  }

  async remove(id: string, teacherId: string, userRole: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check ownership or admin access
    if (lesson.module.course.teacherId !== teacherId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to delete this lesson');
    }

    await this.prisma.lesson.delete({
      where: { id },
    });

    return { message: 'Lesson deleted successfully' };
  }
}
