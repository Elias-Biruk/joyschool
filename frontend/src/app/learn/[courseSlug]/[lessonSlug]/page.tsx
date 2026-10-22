'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { lessonsService, Lesson, CourseModule } from '@/lib/lessons';
import { studentService } from '@/lib/student';
import { sanitizeHtml } from '@/lib/sanitize';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import CodingPlayground from '@/components/CodingPlayground';

export default function LessonViewerPage({ params }: { params: { courseSlug: string; lessonSlug: string } }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadLessonAndCourse();
  }, [isAuthenticated, params.courseSlug, params.lessonSlug, router]);

  const loadLessonAndCourse = async () => {
    setLoading(true);
    setError(null);
    try {
      const lessonData = await lessonsService.getLessonBySlug(params.lessonSlug);
      setLesson(lessonData);
      
      const courseData = await lessonsService.getCourseBySlug(params.courseSlug);
      setCourse(courseData);
      
      // Fetch modules with lessons
      const modulesData = await api.get(`/courses/${courseData.id}/modules`);
      setModules(modulesData.data || []);
      
      // Check if lesson is completed
      const progress = await studentService.getMyProgress();
      const lessonProgress = progress.find(p => p.lessonId === lessonData.id);
      setCompleted(lessonProgress?.completed || false);
      
      // Track all completed lessons
      const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lessonId));
      setCompletedLessons(completedIds);
    } catch (err: any) {
      console.error('Failed to load lesson:', err);
      setError('Failed to load lesson. You may not be enrolled in this course.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      await api.post('/progress', {
        lessonId: lesson!.id,
        completed: true,
        timeSpent: 0,
      });
      setCompleted(true);
      setCompletedLessons(prev => new Set(prev).add(lesson!.id));
    } catch (err) {
      console.error('Failed to mark lesson as complete:', err);
      alert('Failed to mark lesson as complete');
    }
  };

  const getPreviousLesson = () => {
    const allLessons = modules.flatMap(m => m.lessons).sort((a, b) => a.order - b.order);
    const currentIndex = allLessons.findIndex(l => l.id === lesson?.id);
    return currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  };

  const getNextLesson = () => {
    const allLessons = modules.flatMap(m => m.lessons).sort((a, b) => a.order - b.order);
    const currentIndex = allLessons.findIndex(l => l.id === lesson?.id);
    return currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  };

  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading lesson...</div>;
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Lesson not found'}</p>
            <Link href={`/courses/${params.courseSlug}`}>
              <Button>Back to Course</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              JoyEdu
            </Link>
            <Link href={`/courses/${params.courseSlug}`}>
              <Button variant="ghost">Back to Course</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Course Curriculum */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-lg">Course Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div key={module.id}>
                      <div className="font-semibold text-sm mb-2">{module.title}</div>
                      <div className="space-y-1 ml-2">
                        {module.lessons
                          .sort((a, b) => a.order - b.order)
                          .map((l) => (
                            <Link
                              key={l.id}
                              href={`/learn/${params.courseSlug}/${l.slug}`}
                              className={`flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-100 ${
                                l.id === lesson.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600'
                              }`}
                            >
                              {completedLessons.has(l.id) ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="truncate">{l.title}</span>
                            </Link>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge variant="secondary" className="mb-2">{lesson.type}</Badge>
                  <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
                  {lesson.durationMinutes && (
                    <p className="text-sm text-gray-600">Duration: {lesson.durationMinutes} minutes</p>
                  )}
                </div>
                {completed ? (
                  <Badge className="bg-green-600">Completed</Badge>
                ) : (
                  <Button onClick={handleComplete}>Mark as Complete</Button>
                )}
              </div>

              <Separator className="my-6" />

              {/* Video Content */}
              {lesson.videoUrl && (
                <div className="mb-6">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      controls
                      className="w-full h-full"
                      src={lesson.videoUrl}
                    />
                  </div>
                </div>
              )}

              {/* Text Content (skip for CODE lessons) */}
              {lesson.type !== 'CODE' && (
                <div className="prose max-w-none mb-6">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.content) }} />
                </div>
              )}

              {/* Coding Playground */}
              {lesson.type === 'CODE' && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Interactive Coding Playground</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodingPlayground
                      initialHtml={lesson.content}
                      initialCss={(lesson.resources as any)?.css || ''}
                      initialJs={lesson.codeExample || ''}
                      exercise={(lesson.resources as any)?.exercise}
                      onRun={(output: string) => console.log('Code executed:', output)}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Code Example */}
              {lesson.codeExample && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Code Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{lesson.codeExample}</code>
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Resources */}
              {Array.isArray(lesson.resources) && lesson.resources.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {lesson.resources.map((resource: any, index: number) => (
                        <li key={index}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {resource.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                {previousLesson ? (
                  <Link href={`/learn/${params.courseSlug}/${previousLesson.slug}`}>
                    <Button variant="outline">
                      Previous: {previousLesson.title}
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}
                {nextLesson ? (
                  <Link href={`/learn/${params.courseSlug}/${nextLesson.slug}`}>
                    <Button>
                      Next: {nextLesson.title}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/courses/${params.courseSlug}`}>
                    <Button>Back to Course</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
