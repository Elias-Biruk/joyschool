'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { studentService, Enrollment, LessonProgress } from '@/lib/student';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recentProgress, setRecentProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user?.role !== 'STUDENT') {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && user?.role === 'STUDENT') {
      loadStudentData();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadStudentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [enrollmentsData, progressData] = await Promise.all([
        studentService.getMyEnrollments(),
        studentService.getMyProgress(),
      ]);
      setEnrollments(enrollmentsData);
      setRecentProgress(progressData.slice(0, 5));
    } catch (err: any) {
      console.error('Failed to load student data:', err);
      setError('Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border_b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadStudentData} className="w-full">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const completedCourses = enrollments.filter(e => e.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              JoyEdu
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <Badge variant="secondary">Student</Badge>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Track your learning progress and continue your courses</p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Enrolled Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeEnrollments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Completed Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedCourses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Lessons Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recentProgress.filter(p => p.completed).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* My Courses */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">My Courses</h2>
          {activeEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet.</p>
                <Link href="/courses">
                  <Button>Browse Courses</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="flex flex-col">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">
                      {enrollment.course?.level}
                    </Badge>
                    <CardTitle className="line-clamp-2">{enrollment.course?.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {enrollment.course?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {enrollment.progress !== undefined && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} />
                      </div>
                    )}
                    {enrollment.course?.teacher && (
                      <p className="text-sm text-gray-600">
                        Instructor: {enrollment.course.teacher.firstName} {enrollment.course.teacher.lastName}
                      </p>
                    )}
                  </CardContent>
                  <CardContent>
                    <Link href={`/courses/${enrollment.course?.slug}`} className="w-full">
                      <Button className="w-full">Continue Learning</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {recentProgress.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {recentProgress.map((progress) => (
                    <div key={progress.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{progress.lesson?.title}</p>
                        <p className="text-sm text-gray-600">
                          {progress.lesson?.module?.course?.title} • {progress.lesson?.module?.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {progress.completed ? (
                          <Badge variant="default">Completed</Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                        <span className="text-sm text-gray-600">
                          {Math.floor(progress.timeSpent / 60)}m {progress.timeSpent % 60}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Completed Courses */}
        {completedCourses.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Completed Courses</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCourses.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-green-600">Completed</Badge>
                    <CardTitle>{enrollment.course?.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Completed on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                    <Button variant="outline" className="w-full">View Certificate</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
