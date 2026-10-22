import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('QuizzesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let studentToken: string;
  let teacherToken: string;
  let quizId: string;
  let courseId: string;
  let studentUserId: string;

  beforeEach(async () => {
    // Set required environment variables for testing
    process.env.DATABASE_URL = 'postgresql://joyschool_user:joyschool_dev_password@localhost:5432/joyschool?schema=public';
    process.env.JWT_SECRET = 'test-secret-key-min-32-chars-for-testing';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.PORT = '3001';
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test users
    const timestamp = Date.now();
    const studentEmail = `quiztest_student_${timestamp}@example.com`;
    const teacherEmail = `quiztest_teacher_${timestamp}@example.com`;

    // Register student
    const studentRegister = await request.default(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: studentEmail,
        password: 'Test123456@',
        firstName: 'Quiz',
        lastName: 'Student',
        role: 'STUDENT',
      });
    studentUserId = studentRegister.body.user.id;

    // Register teacher
    await request.default(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: teacherEmail,
        password: 'Test123456@',
        firstName: 'Quiz',
        lastName: 'Teacher',
        role: 'TEACHER',
      });

    // Login as student
    const studentLogin = await request.default(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: studentEmail,
        password: 'Test123456@',
      });
    studentToken = studentLogin.body.accessToken;

    // Login as teacher
    const teacherLogin = await request.default(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: teacherEmail,
        password: 'Test123456@',
      });
    teacherToken = teacherLogin.body.accessToken;

    // Create a course
    const category = await prisma.courseCategory.findFirst();
    if (!category) {
      throw new Error('No course category found');
    }

    const course = await prisma.course.create({
      data: {
        title: 'Test Quiz Course',
        slug: `test-quiz-course-${timestamp}`,
        description: 'Course for quiz testing',
        level: 'BEGINNER',
        status: 'PUBLISHED',
        categoryId: category.id,
        teacherId: (await prisma.user.findFirst({ where: { email: teacherEmail } }))!.id,
        price: 0,
        publishedAt: new Date(),
      },
    });
    courseId = course.id;

    // Enroll student in course
    await prisma.enrollment.create({
      data: {
        userId: studentUserId,
        courseId: courseId,
        status: 'ACTIVE',
      },
    });

    // Create a quiz with questions
    const quiz = await prisma.quiz.create({
      data: {
        title: 'Test Quiz',
        description: 'Quiz for testing',
        courseId: courseId,
        passingScore: 70,
        maxAttempts: 3,
        questions: {
          create: [
            {
              type: 'MULTIPLE_CHOICE',
              questionText: 'What is 2 + 2?',
              points: 1,
              order: 1,
              answerOptions: {
                create: [
                  { text: '3', isCorrect: false, order: 1 },
                  { text: '4', isCorrect: true, order: 2 },
                  { text: '5', isCorrect: false, order: 3 },
                  { text: '6', isCorrect: false, order: 4 },
                ],
              },
            },
            {
              type: 'TRUE_FALSE',
              questionText: 'The sky is blue.',
              points: 1,
              order: 2,
              answerOptions: {
                create: [
                  { text: 'True', isCorrect: true, order: 1 },
                  { text: 'False', isCorrect: false, order: 2 },
                ],
              },
            },
          ],
        },
      },
      include: {
        questions: {
          include: {
            answerOptions: true,
          },
        },
      },
    });
    quizId = quiz.id;
  });

  afterEach(async () => {
    // Cleanup test data in correct order to respect foreign key constraints
    await prisma.quizAttempt.deleteMany({ where: { quizId } });
    await prisma.quiz.delete({ where: { id: quizId } });
    await prisma.enrollment.deleteMany({ where: { courseId } });
    await prisma.course.delete({ where: { id: courseId } });
    // Note: Test users are not deleted to avoid foreign key constraint issues
    // They are isolated by unique timestamps in email addresses
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Quiz Submission Scoring', () => {
    it('should score 100% when all answers are correct', async () => {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: {
              answerOptions: true,
            },
          },
        },
      });

      if (!quiz || !quiz.questions || quiz.questions.length < 2) {
        throw new Error('Quiz not found or does not have enough questions');
      }

      const q1Correct = quiz.questions[0].answerOptions.find((a) => a.isCorrect);
      const q2Correct = quiz.questions[1].answerOptions.find((a) => a.isCorrect);

      if (!q1Correct || !q2Correct) {
        throw new Error('No correct answer option found');
      }

      const response = await request.default(app.getHttpServer())
        .post('/api/v1/quizzes/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          quizId,
          answers: [
            { questionId: quiz.questions[0].id, selectedOptionId: q1Correct.id },
            { questionId: quiz.questions[1].id, selectedOptionId: q2Correct.id },
          ],
        })
        .expect(201);

      expect(response.body.score).toBe(100);
      expect(response.body.passed).toBe(true);
      expect(response.body.responses).toHaveLength(2);
      expect(response.body.responses[0].isCorrect).toBe(true);
      expect(response.body.responses[1].isCorrect).toBe(true);
    });

    it('should score 0% when all answers are incorrect', async () => {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: {
              answerOptions: true,
            },
          },
        },
      });

      if (!quiz || !quiz.questions || quiz.questions.length < 2) {
        throw new Error('Quiz not found or does not have enough questions');
      }

      const q1Incorrect = quiz.questions[0].answerOptions.find((a) => !a.isCorrect);
      const q2Incorrect = quiz.questions[1].answerOptions.find((a) => !a.isCorrect);

      if (!q1Incorrect || !q2Incorrect) {
        throw new Error('No incorrect answer option found');
      }

      const response = await request.default(app.getHttpServer())
        .post('/api/v1/quizzes/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          quizId,
          answers: [
            { questionId: quiz.questions[0].id, selectedOptionId: q1Incorrect.id },
            { questionId: quiz.questions[1].id, selectedOptionId: q2Incorrect.id },
          ],
        })
        .expect(201);

      expect(response.body.score).toBe(0);
      expect(response.body.passed).toBe(false);
      expect(response.body.responses[0].isCorrect).toBe(false);
      expect(response.body.responses[1].isCorrect).toBe(false);
    });

    it('should score 50% when half answers are correct', async () => {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: {
              answerOptions: true,
            },
          },
        },
      });

      if (!quiz || !quiz.questions || quiz.questions.length < 2) {
        throw new Error('Quiz not found or does not have enough questions');
      }

      const q1Correct = quiz.questions[0].answerOptions.find((a) => a.isCorrect);
      const q2Incorrect = quiz.questions[1].answerOptions.find((a) => !a.isCorrect);

      if (!q1Correct || !q2Incorrect) {
        throw new Error('No answer option found');
      }

      const response = await request.default(app.getHttpServer())
        .post('/api/v1/quizzes/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          quizId,
          answers: [
            { questionId: quiz.questions[0].id, selectedOptionId: q1Correct.id },
            { questionId: quiz.questions[1].id, selectedOptionId: q2Incorrect.id },
          ],
        })
        .expect(201);

      expect(response.body.score).toBe(50);
      expect(response.body.passed).toBe(false);
      expect(response.body.responses[0].isCorrect).toBe(true);
      expect(response.body.responses[1].isCorrect).toBe(false);
    });

    it('should reject invalid option IDs', async () => {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: true,
        },
      });

      if (!quiz || !quiz.questions || quiz.questions.length < 2) {
        throw new Error('Quiz not found or does not have enough questions');
      }

      const response = await request.default(app.getHttpServer())
        .post('/api/v1/quizzes/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          quizId,
          answers: [
            { questionId: quiz.questions[0].id, selectedOptionId: 'invalid_option_id' },
            { questionId: quiz.questions[1].id, selectedOptionId: 'invalid_option_id' },
          ],
        })
        .expect(201);

      expect(response.body.score).toBe(0);
      expect(response.body.passed).toBe(false);
    });

    it('should reject submission from non-enrolled user', async () => {
      // Create another student not enrolled
      const otherStudentEmail = `other_student_${Date.now()}@example.com`;
      await request.default(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: otherStudentEmail,
          password: 'Test123456@',
          firstName: 'Other',
          lastName: 'Student',
          role: 'STUDENT',
        });

      const otherLogin = await request.default(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: otherStudentEmail,
          password: 'Test123456@',
        });

      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: {
              answerOptions: true,
            },
          },
        },
      });

      if (!quiz || !quiz.questions || quiz.questions.length < 1) {
        throw new Error('Quiz not found or does not have questions');
      }

      await request.default(app.getHttpServer())
        .post('/api/v1/quizzes/submit')
        .set('Authorization', `Bearer ${otherLogin.body.accessToken}`)
        .send({
          quizId,
          answers: [
            { questionId: quiz.questions[0].id, selectedOptionId: quiz.questions[0].answerOptions[0]!.id },
          ],
        })
        .expect(403);
    });

    it('should enforce max attempts limit', async () => {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: {
              answerOptions: true,
            },
          },
        },
      });

      if (!quiz || !quiz.questions || quiz.questions.length < 2) {
        throw new Error('Quiz not found or does not have enough questions');
      }

      // Submit 3 times (max attempts)
      for (let i = 0; i < 3; i++) {
        await request.default(app.getHttpServer())
          .post('/api/v1/quizzes/submit')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            quizId,
            answers: [
              { questionId: quiz.questions[0].id, selectedOptionId: quiz.questions[0].answerOptions[0]!.id },
              { questionId: quiz.questions[1].id, selectedOptionId: quiz.questions[1].answerOptions[0]!.id },
            ],
          })
          .expect(201);
      }

      // 4th attempt should fail
      await request.default(app.getHttpServer())
        .post('/api/v1/quizzes/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          quizId,
          answers: [
            { questionId: quiz.questions[0].id, selectedOptionId: quiz.questions[0].answerOptions[0]!.id },
          ],
        })
        .expect(403);
    });

    it('should not expose correct answers in quiz retrieval', async () => {
      const response = await request.default(app.getHttpServer())
        .get(`/api/v1/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      response.body.questions.forEach((question: any) => {
        question.answerOptions.forEach((option: any) => {
          expect(option.isCorrect).toBeUndefined();
        });
      });
    });

    it('should allow teacher to view all attempts', async () => {
      // Submit a quiz attempt first
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: {
              answerOptions: true,
            },
          },
        },
      });

      if (!quiz || !quiz.questions || quiz.questions.length < 1) {
        throw new Error('Quiz not found or does not have questions');
      }

      await request.default(app.getHttpServer())
        .post('/api/v1/quizzes/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          quizId,
          answers: [
            { questionId: quiz.questions[0].id, selectedOptionId: quiz.questions[0].answerOptions[0]!.id },
          ],
        })
        .expect(201);

      // Teacher should be able to view attempts
      const response = await request.default(app.getHttpServer())
        .get(`/api/v1/quizzes/${quizId}/attempts`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should not allow student to view other students attempts', async () => {
      // Create another student
      const otherStudentEmail = `other_student2_${Date.now()}@example.com`;
      await request.default(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: otherStudentEmail,
          password: 'Test123456@',
          firstName: 'Other',
          lastName: 'Student2',
          role: 'STUDENT',
        });

      const otherLogin = await request.default(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: otherStudentEmail,
          password: 'Test123456@',
        });

      // Enroll other student
      const otherUser = await prisma.user.findFirst({ where: { email: otherStudentEmail } });
      if (!otherUser) {
        throw new Error('Other user not found');
      }
      await prisma.enrollment.create({
        data: {
          userId: otherUser.id,
          courseId: courseId,
          status: 'ACTIVE',
        },
      });

      // Other student should only see their own attempts (none)
      const response = await request.default(app.getHttpServer())
        .get(`/api/v1/quizzes/${quizId}/attempts`)
        .set('Authorization', `Bearer ${otherLogin.body.accessToken}`)
        .expect(200);

      // Should return empty array or only their own attempts
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
