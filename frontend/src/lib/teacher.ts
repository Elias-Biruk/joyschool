import api from './api';

export interface TeacherCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  level: string;
  status: string;
  categoryId: string;
  price: number;
  durationHours?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    enrollments: number;
    modules: number;
  };
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  enrolledAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
}

export const teacherService = {
  async getMyCourses(): Promise<TeacherCourse[]> {
    const response = await api.get('/v1/courses/teacher/my-courses');
    return response.data;
  },

  async createCourse(courseData: any): Promise<TeacherCourse> {
    const response = await api.post('/v1/courses', courseData);
    return response.data;
  },

  async updateCourse(id: string, courseData: any): Promise<TeacherCourse> {
    const response = await api.put(`/v1/courses/${id}`, courseData);
    return response.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/v1/courses/${id}`);
  },

  async publishCourse(id: string): Promise<TeacherCourse> {
    const response = await api.post(`/v1/courses/${id}/publish`);
    return response.data;
  },

  async unpublishCourse(id: string): Promise<TeacherCourse> {
    const response = await api.post(`/v1/courses/${id}/unpublish`);
    return response.data;
  },

  async getCourseEnrollments(courseId: string): Promise<CourseEnrollment[]> {
    const response = await api.get(`/v1/enrollments/course/${courseId}`);
    return response.data;
  },
};
