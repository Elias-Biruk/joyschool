'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { coursesService, Course } from '@/lib/courses';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [params.slug]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const data = await coursesService.getCourseBySlug(params.slug);
      setCourse(data);
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setEnrolling(true);
    try {
      await coursesService.enroll(course!.id);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to enroll:', error);
      alert(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!course) {
    return <div className="min-h-screen flex items-center justify-center">Course not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              JoyEdu
            </Link>
            <Link href="/courses">
              <Button variant="ghost">Back to Courses</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex gap-2 mb-4">
                <Badge variant="secondary">{course.level}</Badge>
                {course.category && <Badge>{course.category.name}</Badge>}
              </div>
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-6">{course.description}</p>

              {course.teacher && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {course.teacher.avatar ? (
                      <img
                        src={course.teacher.avatar}
                        alt={course.teacher.firstName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <span className="text-blue-600 font-semibold">
                        {course.teacher.firstName[0]}{course.teacher.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {course.teacher.firstName} {course.teacher.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Instructor</p>
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">What You'll Learn</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {course.learningObjectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>

                {course.prerequisites.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Prerequisites</h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      {course.prerequisites.map((prereq, index) => (
                        <li key={index}>{prereq}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {course.modules && course.modules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Curriculum</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.modules.map((module) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">{module.title}</h3>
                        {module.description && (
                          <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                        )}
                        {module.lessons && module.lessons.length > 0 && (
                          <div className="space-y-1">
                            {module.lessons.map((lesson) => (
                              <div key={lesson.id} className="text-sm text-gray-600 pl-4">
                                • {lesson.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                {course.durationHours && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{course.durationHours} hours</p>
                  </div>
                )}
                {course._count?.modules && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Modules</p>
                    <p className="font-semibold">{course._count.modules}</p>
                  </div>
                )}
                {course._count?.enrollments && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600">Students Enrolled</p>
                    <p className="font-semibold">{course._count.enrollments}</p>
                  </div>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </Button>
                {course.price === 0 && (
                  <p className="text-center text-sm text-green-600 mt-2">Free</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
