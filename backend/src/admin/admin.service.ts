import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    const [totalUsers, totalCourses, totalEnrollments, activeUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.enrollment.count(),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeUsers,
    };
  }

  async getUsers(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserRole(userId: string, updateRoleDto: UpdateUserRoleDto, adminId: string) {
    // Verify admin is actually an admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update user roles');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent removing the last admin
    if (user.role === 'ADMIN' && updateRoleDto.role !== 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot remove the last admin');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: updateRoleDto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        action: 'ROLE_ASSIGNED',
        entityType: 'User',
        entityId: userId,
        performedBy: adminId,
        details: { oldRole: user.role, newRole: updateRoleDto.role },
      },
    });

    return updated;
  }

  async suspendUser(userId: string, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can suspend users');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent suspending the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot suspend the last admin');
      }
    }

    // Prevent self-suspension
    if (userId === adminId) {
      throw new ForbiddenException('Cannot suspend yourself');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        action: 'USER_SUSPENDED',
        entityType: 'User',
        entityId: userId,
        performedBy: adminId,
      },
    });

    return updated;
  }

  async reactivateUser(userId: string, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can reactivate users');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        action: 'USER_REACTIVATED',
        entityType: 'User',
        entityId: userId,
        performedBy: adminId,
      },
    });

    return updated;
  }

  async getCourses(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as any } : {};

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveCourse(courseId: string, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve courses');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        action: 'COURSE_APPROVED',
        entityType: 'Course',
        entityId: courseId,
        performedBy: adminId,
      },
    });

    return updated;
  }

  async rejectCourse(courseId: string, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can reject courses');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: 'DRAFT' },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        action: 'COURSE_REJECTED',
        entityType: 'Course',
        entityId: courseId,
        performedBy: adminId,
      },
    });

    return updated;
  }

  async unpublishCourse(courseId: string, adminId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can unpublish courses');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        action: 'COURSE_UNPUBLISHED',
        entityType: 'Course',
        entityId: courseId,
        performedBy: adminId,
      },
    });

    return updated;
  }
}
