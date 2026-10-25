'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { teacherService, TeacherCourse } from '@/lib/teacher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user?.role !== 'TEACHER') {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && user?.role === 'TEACHER') {
      loadTeacherData();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadTeacherData = async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesData = await teacherService.getMyCourses();
      // Ensure coursesData is always an array
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (err: any) {
      console.error('Failed to load teacher data:', err);
      setError('Failed to load your courses. Please try again.');
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (courseId: string) => {
    try {
      await teacherService.publishCourse(courseId);
      loadTeacherData();
    } catch (err) {
      console.error('Failed to publish course:', err);
      alert('Failed to publish course');
    }
  };

  const handleUnpublish = async (courseId: string) => {
    try {
      await teacherService.unpublishCourse(courseId);
      loadTeacherData();
    } catch (err) {
      console.error('Failed to unpublish course:', err);
      alert('Failed to unpublish course');
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    try {
      await teacherService.deleteCourse(courseId);
      loadTeacherData();
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert('Failed to delete course');
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
            <Button onClick={loadTeacherData} className="w-full">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const publishedCourses = (courses || []).filter(c => c.status === 'PUBLISHED');
  const draftCourses = (courses || []).filter(c => c.status === 'DRAFT');
  const totalEnrollments = (courses || []).reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);

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
              <Badge variant="secondary">Teacher</Badge>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
            <p className="text-gray-600">Manage your courses and track student progress</p>
          </div>
          <Link href="/courses/create">
            <Button>Create New Course</Button>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{courses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{publishedCourses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{draftCourses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEnrollments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Published Courses */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Published Courses</h2>
          {publishedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">You haven't published any courses yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-green-600">Published</Badge>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-600">
                        {course._count?.enrollments || 0} students enrolled
                      </span>
                      <Badge variant="secondary">{course.level}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/courses/${course.slug}/edit`} className="flex-1">
                        <Button variant="outline" className="w-full">Edit Course</Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUnpublish(course.id)}
                      >
                        Unpublish
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Draft Courses */}
        {draftCourses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Draft Courses</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">Draft</Badge>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Link href={`/courses/${course.slug}/edit`} className="flex-1">
                        <Button variant="outline" className="w-full">Edit Course</Button>
                      </Link>
                      <Button
                        variant="default"
                        onClick={() => handlePublish(course.id)}
                      >
                        Publish
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(course.id)}
                      >
                        Delete
                      </Button>
                    </div>
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
