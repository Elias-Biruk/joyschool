import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../src/admin/admin.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              count: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            course: {
              count: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            enrollment: {
              count: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get platform stats', async () => {
    const mockStats = {
      totalUsers: 100,
      totalCourses: 50,
      totalEnrollments: 200,
      activeUsers: 80,
    };

    jest.spyOn(service['prisma'].user, 'count').mockResolvedValueOnce(100);
    jest.spyOn(service['prisma'].course, 'count').mockResolvedValueOnce(50);
    jest.spyOn(service['prisma'].enrollment, 'count').mockResolvedValueOnce(200);

    const stats = await service.getPlatformStats();
    expect(stats.totalUsers).toBe(100);
  });
});
