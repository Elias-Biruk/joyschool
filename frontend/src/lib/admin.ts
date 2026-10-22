import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  status: string;
  teacherId: string;
  teacher?: {
    firstName: string;
    lastName: string;
  };
  _count?: {
    enrollments: number;
  };
}

export interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  activeUsers: number;
}

export const adminService = {
  async getStats(): Promise<PlatformStats> {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<{ data: User[]; meta: any }> {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async updateUserRole(userId: string, role: string): Promise<User> {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  async suspendUser(userId: string): Promise<User> {
    const response = await api.put(`/admin/users/${userId}/suspend`);
    return response.data;
  },

  async reactivateUser(userId: string): Promise<User> {
    const response = await api.put(`/admin/users/${userId}/reactivate`);
    return response.data;
  },

  async getCourses(params?: { page?: number; limit?: number; status?: string }): Promise<{ data: Course[]; meta: any }> {
    const response = await api.get('/admin/courses', { params });
    return response.data;
  },

  async approveCourse(courseId: string): Promise<Course> {
    const response = await api.put(`/admin/courses/${courseId}/approve`);
    return response.data;
  },

  async rejectCourse(courseId: string): Promise<Course> {
    const response = await api.put(`/admin/courses/${courseId}/reject`);
    return response.data;
  },

  async unpublishCourse(courseId: string): Promise<Course> {
    const response = await api.put(`/admin/courses/${courseId}/unpublish`);
    return response.data;
  },
};
