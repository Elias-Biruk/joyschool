import api from './api';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: string;
  categoryId: string;
  teacherId: string;
  price: number;
  durationHours?: number;
  prerequisites: string[];
  learningObjectives: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  _count?: {
    enrollments: number;
    modules: number;
  };
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  courseId: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  content: string;
  type: 'TEXT' | 'VIDEO' | 'CODE' | 'RESOURCE';
  videoUrl?: string;
  durationMinutes?: number;
  codeExample?: string;
  resources?: any;
  isRequired: boolean;
  moduleId: string;
  order: number;
}

export interface CourseListResponse {
  data: Course[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const coursesService = {
  async getCourses(params?: {
    search?: string;
    categoryId?: string;
    level?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<CourseListResponse> {
    const response = await api.get('/v1/courses', { params });
    return response.data;
  },

  async getCourseBySlug(slug: string): Promise<Course> {
    const response = await api.get(`/v1/courses/slug/${slug}`);
    return response.data;
  },

  async getCourseById(id: string): Promise<Course> {
    const response = await api.get(`/v1/courses/${id}`);
    return response.data;
  },

  async enroll(courseId: string): Promise<any> {
    const response = await api.post('/v1/enrollments', { courseId });
    return response.data;
  },

  async getMyEnrollments(): Promise<any[]> {
    const response = await api.get('/v1/enrollments/my-enrollments');
    return response.data;
  },

  async createCourse(courseData: any): Promise<Course> {
    const response = await api.post('/v1/courses', courseData);
    return response.data;
  },

  async updateCourse(id: string, courseData: any): Promise<Course> {
    const response = await api.put(`/v1/courses/${id}`, courseData);
    return response.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/v1/courses/${id}`);
  },

  async publishCourse(id: string): Promise<Course> {
    const response = await api.post(`/v1/courses/${id}/publish`);
    return response.data;
  },

  async unpublishCourse(id: string): Promise<Course> {
    const response = await api.post(`/v1/courses/${id}/unpublish`);
    return response.data;
  },
};

export const modulesService = {
  async createModule(moduleData: any): Promise<CourseModule> {
    const response = await api.post('/v1/modules', moduleData);
    return response.data;
  },

  async updateModule(id: string, moduleData: any): Promise<CourseModule> {
    const response = await api.put(`/v1/modules/${id}`, moduleData);
    return response.data;
  },

  async deleteModule(id: string): Promise<void> {
    await api.delete(`/v1/modules/${id}`);
  },

  async reorderModules(moduleIds: string[]): Promise<void> {
    await api.post('/v1/modules/reorder', { moduleIds });
  },
};

export const lessonsService = {
  async createLesson(lessonData: any): Promise<Lesson> {
    const response = await api.post('/v1/lessons', lessonData);
    return response.data;
  },

  async updateLesson(id: string, lessonData: any): Promise<Lesson> {
    const response = await api.put(`/v1/lessons/${id}`, lessonData);
    return response.data;
  },

  async deleteLesson(id: string): Promise<void> {
    await api.delete(`/v1/lessons/${id}`);
  },

  async reorderLessons(lessonIds: string[]): Promise<void> {
    await api.post('/v1/lessons/reorder', { lessonIds });
  },
};
