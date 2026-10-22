import api from './api';

export interface Question {
  id: string;
  type: string;
  questionText: string;
  codeTemplate?: string;
  expectedOutput?: string;
  points: number;
  order: number;
  answerOptions?: AnswerOption[];
}

export interface AnswerOption {
  id: string;
  text: string;
  order: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  moduleId?: string;
  timeLimitMinutes?: number;
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  order?: number;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  attemptNumber: number;
  startedAt: string;
  completedAt?: string;
  timeSpentMinutes?: number;
  responses: QuizResponse[];
}

export interface QuizResponse {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string;
  codeAnswer?: string;
  isCorrect?: boolean;
  pointsEarned: number;
}

export const quizzesService = {
  async getQuizById(id: string): Promise<Quiz> {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    const response = await api.get(`/quizzes/course/${courseId}`);
    return response.data;
  },

  async submitQuiz(quizId: string, answers: Array<{ questionId: string; selectedOptionId?: string; codeAnswer?: string }>): Promise<QuizAttempt> {
    const response = await api.post('/quizzes/submit', {
      quizId,
      answers,
    });
    return response.data;
  },

  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    const response = await api.get(`/quizzes/${quizId}/attempts`);
    return response.data;
  },

  async deleteQuiz(id: string): Promise<void> {
    await api.delete(`/quizzes/${id}`);
  },
};
