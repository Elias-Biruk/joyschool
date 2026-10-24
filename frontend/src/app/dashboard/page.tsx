'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading to prevent race conditions
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user) {
      // Check if onboarding is required
      if (!user.onboardingCompleted) {
        router.push('/onboarding');
        return;
      }

      // Redirect based on role
      if (user.role === 'STUDENT') {
        router.push('/dashboard/student');
      } else if (user.role === 'TEACHER') {
        router.push('/dashboard/teacher');
      } else if (user.role === 'ADMIN') {
        router.push('/dashboard/admin');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
}
