import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.courseCategory.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    return this.prisma.courseCategory.create({
      data: createCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findAll() {
    return this.prisma.courseCategory.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { courses: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        courses: {
          where: { status: 'PUBLISHED' },
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            category: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.courseCategory.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    return category;
  }

  async remove(id: string) {
    // Check if category has courses
    const coursesCount = await this.prisma.course.count({
      where: { categoryId: id },
    });

    if (coursesCount > 0) {
      throw new ConflictException('Cannot delete category with courses');
    }

    // Check if category has children
    const childrenCount = await this.prisma.courseCategory.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new ConflictException('Cannot delete category with subcategories');
    }

    await this.prisma.courseCategory.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}
