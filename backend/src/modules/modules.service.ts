import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ReorderModuleDto } from './dto/reorder-module.dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async create(createModuleDto: CreateModuleDto, teacherId: string) {
    // Verify course exists and user owns it
    const course = await this.prisma.course.findUnique({
      where: { id: createModuleDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('Not authorized to add modules to this course');
    }

    return this.prisma.courseModule.create({
      data: createModuleDto,
    });
  }

  async update(id: string, updateModuleDto: UpdateModuleDto, teacherId: string, userRole: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check ownership or admin access
    if (module.course.teacherId !== teacherId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to update this module');
    }

    return this.prisma.courseModule.update({
      where: { id },
      data: updateModuleDto,
    });
  }

  async remove(id: string, teacherId: string, userRole: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: true,
        lessons: true,
      },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check ownership or admin access
    if (module.course.teacherId !== teacherId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to delete this module');
    }

    // Check if module has lessons
    if (module.lessons.length > 0) {
      throw new ForbiddenException('Cannot delete module with lessons. Delete lessons first.');
    }

    await this.prisma.courseModule.delete({
      where: { id },
    });

    return { message: 'Module deleted successfully' };
  }

  async reorder(reorderModuleDto: ReorderModuleDto, teacherId: string, userRole: string) {
    const { moduleIds } = reorderModuleDto;

    // Verify all modules exist and belong to the same course owned by the teacher
    const modules = await this.prisma.courseModule.findMany({
      where: { id: { in: moduleIds } },
      include: { course: true },
    });

    if (modules.length !== moduleIds.length) {
      throw new NotFoundException('One or more modules not found');
    }

    // Verify all modules belong to the same course
    const courseId = modules[0].courseId;
    const hasDifferentCourse = modules.some((m) => m.courseId !== courseId);
    if (hasDifferentCourse) {
      throw new ForbiddenException('All modules must belong to the same course');
    }

    // Verify ownership
    if (modules[0].course.teacherId !== teacherId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to reorder modules in this course');
    }

    // Update order for all modules in a transaction
    await this.prisma.$transaction(
      moduleIds.map((moduleId, index) =>
        this.prisma.courseModule.update({
          where: { id: moduleId },
          data: { order: index },
        }),
      ),
    );

    return { message: 'Modules reordered successfully' };
  }
}
