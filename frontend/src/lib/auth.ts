import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatar?: string;
  bio?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async register(data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await api.post('/v1/auth/register', data);
    return response.data;
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await api.post('/v1/auth/login', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/v1/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/v1/auth/me');
    return response.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/v1/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/v1/auth/reset-password', { token, newPassword });
  },
};

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const getAccessToken = () => localStorage.getItem('accessToken');
