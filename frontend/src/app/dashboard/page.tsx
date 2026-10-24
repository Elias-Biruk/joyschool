'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[Dashboard] Effect triggered - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', !!user);

    // Don't redirect while loading to prevent race conditions
    if (loading) {
      console.log('[Dashboard] Still loading, waiting...');
      return;
    }

    if (!isAuthenticated) {
      console.log('[Dashboard] Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    if (isAuthenticated && user) {
      console.log('[Dashboard] Authenticated, role:', user.role, 'onboardingCompleted:', user.onboardingCompleted);

      // Check if onboarding is required
      if (!user.onboardingCompleted) {
        console.log('[Dashboard] Onboarding required, redirecting to /onboarding');
        router.push('/onboarding');
        return;
      }

      // Redirect based on role
      if (user.role === 'STUDENT') {
        console.log('[Dashboard] Redirecting to /dashboard/student');
        router.push('/dashboard/student');
      } else if (user.role === 'TEACHER') {
        console.log('[Dashboard] Redirecting to /dashboard/teacher');
        router.push('/dashboard/teacher');
      } else if (user.role === 'ADMIN') {
        console.log('[Dashboard] Redirecting to /dashboard/admin');
        router.push('/dashboard/admin');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
}
