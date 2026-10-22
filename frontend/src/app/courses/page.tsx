'use client';

import { useState, useEffect } from 'react';
import { coursesService, Course } from '@/lib/courses';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<string>('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadCourses();
  }, [search, level]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await coursesService.getCourses({
        search: search || undefined,
        level: level || undefined,
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              JoyEdu
            </Link>
            <div className="flex gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign in</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Browse Courses</h1>
          <div className="flex gap-4">
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={level} onValueChange={(value) => setLevel(value || '')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading courses...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{course.level}</Badge>
                    {course._count?.enrollments && (
                      <span className="text-sm text-gray-500">
                        {course._count.enrollments} students
                      </span>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm text-gray-600">
                    {course.durationHours && (
                      <p>Duration: {course.durationHours} hours</p>
                    )}
                    {course.teacher && (
                      <p>
                        Instructor: {course.teacher.firstName} {course.teacher.lastName}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/courses/${course.slug}`} className="w-full">
                    <Button className="w-full">View Course</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No courses found. Try adjusting your search or filters.
          </div>
        )}
      </main>
    </div>
  );
}
