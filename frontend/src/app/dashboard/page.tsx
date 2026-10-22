'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!loading && isAuthenticated && user) {
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
