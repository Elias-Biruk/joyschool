import api from './api';

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  enrolledAt: string;
  progress?: number;
  course?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail?: string;
    level: string;
    teacher?: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  timeSpent: number;
  completedAt?: string;
  lesson?: {
    id: string;
    title: string;
    order: number;
    module?: {
      id: string;
      title: string;
      course?: {
        id: string;
        title: string;
        slug: string;
      };
    };
  };
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

export const studentService = {
  async getMyEnrollments(): Promise<Enrollment[]> {
    const response = await api.get('/v1/enrollments/my-enrollments');
    return response.data;
  },

  async getMyProgress(): Promise<LessonProgress[]> {
    const response = await api.get('/v1/progress');
    return response.data;
  },

  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    const response = await api.get(`/v1/progress/course/${courseId}`);
    return response.data;
  },
};
