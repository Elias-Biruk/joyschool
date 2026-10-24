import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatar?: string;
  bio?: string;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
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
    role: 'STUDENT' | 'TEACHER';
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

  async googleAuth(idToken: string): Promise<AuthResponse> {
    console.log('authService.googleAuth called with idToken length:', idToken?.length);
    const response = await api.post('/v1/auth/google', { idToken });
    console.log('authService.googleAuth response status:', response.status);
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/v1/auth/me');
    return response.data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post('/v1/auth/verify-email', { token });
    return response.data;
  },

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const response = await api.post('/v1/auth/resend-verification', { email });
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/v1/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post('/v1/auth/reset-password', { token, newPassword });
    return response.data;
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
