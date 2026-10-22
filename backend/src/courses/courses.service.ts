import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { CourseStatus } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto, teacherId: string) {
    // Verify category exists
    const category = await this.prisma.courseCategory.findUnique({
      where: { id: createCourseDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if slug is unique
    const existing = await this.prisma.course.findUnique({
      where: { slug: createCourseDto.slug },
    });

    if (existing) {
      throw new ForbiddenException('Course with this slug already exists');
    }

    return this.prisma.course.create({
      data: {
        ...createCourseDto,
        teacherId,
        status: CourseStatus.DRAFT,
        price: createCourseDto.price || 0,
      },
      include: {
        category: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryCourseDto) {
    const { search, categoryId, level, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: CourseStatus.PUBLISHED,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (level) {
      where.level = level;
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
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
          _count: {
            select: {
              enrollments: true,
              modules: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
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
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
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
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findTeacherCourses(teacherId: string, query: QueryCourseDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where: { teacherId },
        include: {
          category: true,
          _count: {
            select: {
              enrollments: true,
              modules: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.course.count({ where: { teacherId } }),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, userId: string, userRole: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check ownership or admin access
    if (course.teacherId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own courses');
    }

    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
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
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check ownership or admin access
    if (course.teacherId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own courses');
    }

    // Check if course has enrollments
    if (course.enrollments.length > 0) {
      throw new ForbiddenException('Cannot delete course with enrollments');
    }

    await this.prisma.course.delete({
      where: { id },
    });

    return { message: 'Course deleted successfully' };
  }

  async publish(id: string, userId: string, userRole: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check ownership or admin access
    if (course.teacherId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only publish your own courses');
    }

    // Validation: course must have at least one module with lessons
    if (course.modules.length === 0) {
      throw new ForbiddenException('Course must have at least one module');
    }

    const hasLessons = course.modules.some((module: any) => module.lessons.length > 0);
    if (!hasLessons) {
      throw new ForbiddenException('Course must have at least one lesson');
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  async unpublish(id: string, userId: string, userRole: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check ownership or admin access
    if (course.teacherId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only unpublish your own courses');
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        status: CourseStatus.DRAFT,
        publishedAt: null,
      },
    });
  }
}
