import api from './api';

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  content: string;
  type: string;
  videoUrl?: string;
  durationMinutes?: number;
  codeExample?: string;
  resources?: any[] | {
    css?: string;
    exercise?: {
      title: string;
      description: string;
      expectedOutput?: string;
      hints?: string[];
    };
  };
  isRequired: boolean;
  moduleId: string;
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
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

export const lessonsService = {
  async getLessonBySlug(slug: string): Promise<Lesson> {
    const response = await api.get(`/lessons/slug/${slug}`);
    return response.data;
  },

  async getCourseBySlug(slug: string): Promise<any> {
    const response = await api.get(`/courses/slug/${slug}`);
    return response.data;
  },

  async getLessonById(id: string): Promise<Lesson> {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  },
};
