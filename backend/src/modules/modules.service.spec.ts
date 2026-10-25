import { Test, TestingModule } from '@nestjs/testing';
import { ModulesService } from './modules.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ModulesService', () => {
  let service: ModulesService;
  let prisma: PrismaService;

  const mockPrisma = {
    courseModule: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    lesson: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ModulesService>(ModulesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a module successfully', async () => {
      const createModuleDto = {
        title: 'Test Module',
        description: 'Test Description',
        courseId: 'course-1',
        order: 0,
      };

      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        teacherId: 'teacher-1',
      });

      mockPrisma.courseModule.create.mockResolvedValue({
        id: 'module-1',
        ...createModuleDto,
      });

      const result = await service.create(createModuleDto, 'teacher-1');

      expect(result).toEqual({
        id: 'module-1',
        ...createModuleDto,
      });
      expect(mockPrisma.courseModule.create).toHaveBeenCalledWith({
        data: createModuleDto,
      });
    });

    it('should throw NotFoundException if course does not exist', async () => {
      const createModuleDto = {
        title: 'Test Module',
        courseId: 'non-existent',
        order: 0,
      };

      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(service.create(createModuleDto, 'teacher-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if user does not own the course', async () => {
      const createModuleDto = {
        title: 'Test Module',
        courseId: 'course-1',
        order: 0,
      };

      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        teacherId: 'other-teacher',
      });

      await expect(service.create(createModuleDto, 'teacher-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('update', () => {
    it('should update a module successfully', async () => {
      const updateModuleDto = {
        title: 'Updated Module',
      };

      mockPrisma.courseModule.findUnique.mockResolvedValue({
        id: 'module-1',
        title: 'Old Module',
        course: {
          teacherId: 'teacher-1',
        },
      });

      mockPrisma.courseModule.update.mockResolvedValue({
        id: 'module-1',
        ...updateModuleDto,
      });

      const result = await service.update('module-1', updateModuleDto, 'teacher-1', 'TEACHER');

      expect(result).toEqual({
        id: 'module-1',
        ...updateModuleDto,
      });
    });

    it('should allow admin to update any module', async () => {
      const updateModuleDto = {
        title: 'Updated Module',
      };

      mockPrisma.courseModule.findUnique.mockResolvedValue({
        id: 'module-1',
        title: 'Old Module',
        course: {
          teacherId: 'other-teacher',
        },
      });

      mockPrisma.courseModule.update.mockResolvedValue({
        id: 'module-1',
        ...updateModuleDto,
      });

      const result = await service.update('module-1', updateModuleDto, 'admin-1', 'ADMIN');

      expect(result).toEqual({
        id: 'module-1',
        ...updateModuleDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a module successfully', async () => {
      mockPrisma.courseModule.findUnique.mockResolvedValue({
        id: 'module-1',
        title: 'Test Module',
        course: {
          teacherId: 'teacher-1',
        },
        lessons: [],
      });

      mockPrisma.courseModule.delete.mockResolvedValue({});

      const result = await service.remove('module-1', 'teacher-1', 'TEACHER');

      expect(result).toEqual({ message: 'Module deleted successfully' });
    });

    it('should throw ForbiddenException if module has lessons', async () => {
      mockPrisma.courseModule.findUnique.mockResolvedValue({
        id: 'module-1',
        title: 'Test Module',
        course: {
          teacherId: 'teacher-1',
        },
        lessons: [{ id: 'lesson-1' }],
      });

      await expect(service.remove('module-1', 'teacher-1', 'TEACHER')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('reorder', () => {
    it('should reorder modules successfully', async () => {
      const reorderModuleDto = {
        moduleIds: ['module-1', 'module-2'],
      };

      mockPrisma.courseModule.findMany.mockResolvedValue([
        {
          id: 'module-1',
          courseId: 'course-1',
          course: { teacherId: 'teacher-1' },
        },
        {
          id: 'module-2',
          courseId: 'course-1',
          course: { teacherId: 'teacher-1' },
        },
      ]);

      mockPrisma.$transaction.mockResolvedValue(undefined);

      const result = await service.reorder(reorderModuleDto, 'teacher-1', 'TEACHER');

      expect(result).toEqual({ message: 'Modules reordered successfully' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if modules belong to different courses', async () => {
      const reorderModuleDto = {
        moduleIds: ['module-1', 'module-2'],
      };

      mockPrisma.courseModule.findMany.mockResolvedValue([
        {
          id: 'module-1',
          courseId: 'course-1',
          course: { teacherId: 'teacher-1' },
        },
        {
          id: 'module-2',
          courseId: 'course-2',
          course: { teacherId: 'teacher-1' },
        },
      ]);

      await expect(service.reorder(reorderModuleDto, 'teacher-1', 'TEACHER')).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
