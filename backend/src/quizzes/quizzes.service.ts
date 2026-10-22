import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerOptionDto } from './dto/create-answer-option.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async createQuiz(createQuizDto: CreateQuizDto, teacherId: string) {
    // Verify teacher owns the course
    const course = await this.prisma.course.findUnique({
      where: { id: createQuizDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to create quizzes for this course');
    }

    return this.prisma.quiz.create({
      data: createQuizDto,
      include: {
        questions: {
          include: {
            answerOptions: true,
          },
        },
      },
    });
  }

  async getQuizById(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            answerOptions: true,
          },
          orderBy: { order: 'asc' },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Don't expose correct answers to students
    const quizForStudent = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        answerOptions: q.answerOptions.map((a) => ({
          ...a,
          isCorrect: undefined,
        })),
      })),
    };

    return quizForStudent;
  }

  async getQuizzesByCourse(courseId: string) {
    return this.prisma.quiz.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createQuestion(createQuestionDto: CreateQuestionDto, teacherId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: createQuestionDto.quizId },
      include: { course: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to add questions to this quiz');
    }

    return this.prisma.question.create({
      data: {
        ...createQuestionDto,
        order: createQuestionDto.order ?? 0,
      },
    });
  }

  async createAnswerOption(createAnswerOptionDto: CreateAnswerOptionDto, teacherId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: createAnswerOptionDto.questionId },
      include: {
        quiz: {
          include: { course: true },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.quiz.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to add answer options to this question');
    }

    return this.prisma.answerOption.create({
      data: {
        ...createAnswerOptionDto,
        order: createAnswerOptionDto.order ?? 0,
      },
    });
  }

  async submitQuiz(submitQuizDto: SubmitQuizDto, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: submitQuizDto.quizId },
      include: {
        questions: {
          include: {
            answerOptions: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check if user is enrolled in the course
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to take the quiz');
    }

    // Check attempt limit
    const previousAttempts = await this.prisma.quizAttempt.count({
      where: {
        quizId: quiz.id,
        userId,
      },
    });

    if (previousAttempts >= quiz.maxAttempts) {
      throw new ForbiddenException('You have reached the maximum number of attempts for this quiz');
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const responses = [];

    for (const answer of submitQuizDto.answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      totalPoints += question.points;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        const selectedOption = question.answerOptions.find(
          (a) => a.id === answer.selectedOptionId,
        );
        if (selectedOption && selectedOption.isCorrect) {
          isCorrect = true;
          pointsEarned = question.points;
        }
        // Only include selectedOptionId if it's valid (belongs to this question)
        const validOptionId = selectedOption ? answer.selectedOptionId : undefined;
        responses.push({
          questionId: answer.questionId,
          selectedOptionId: validOptionId,
          codeAnswer: answer.codeAnswer,
          isCorrect,
          pointsEarned,
        });
      } else if (question.type === 'CODING') {
        // For coding questions, we would need a more sophisticated validation
        // For now, we'll mark as incorrect unless we implement code execution
        isCorrect = false;
        pointsEarned = 0;
        responses.push({
          questionId: answer.questionId,
          selectedOptionId: undefined,
          codeAnswer: answer.codeAnswer,
          isCorrect,
          pointsEarned,
        });
      }

      earnedPoints += pointsEarned;
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= quiz.passingScore;

    // Create quiz attempt
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId,
        score,
        passed,
        attemptNumber: previousAttempts + 1,
        completedAt: new Date(),
        timeSpentMinutes: 0, // Would need to track start time
        responses: {
          create: responses,
        },
      },
      include: {
        responses: true,
      },
    });

    return attempt;
  }

  async getQuizAttempts(quizId: string, userId: string) {
    // Verify user is enrolled or is teacher
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.courseId,
        },
      },
    });

    if (!enrollment && quiz.course.teacherId !== userId) {
      throw new ForbiddenException('You do not have permission to view attempts for this quiz');
    }

    return this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        responses: {
          include: {
            question: true,
            selectedOption: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async deleteQuiz(id: string, teacherId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to delete this quiz');
    }

    await this.prisma.quiz.delete({
      where: { id },
    });

    return { message: 'Quiz deleted successfully' };
  }
}
