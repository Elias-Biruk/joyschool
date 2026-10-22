import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from '../src/quizzes/quizzes.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('QuizzesService', () => {
  let service: QuizzesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        {
          provide: PrismaService,
          useValue: {
            quiz: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            question: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            answerOption: {
              create: jest.fn(),
            },
            quizAttempt: {
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
            },
            enrollment: {
              findUnique: jest.fn(),
            },
            course: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
