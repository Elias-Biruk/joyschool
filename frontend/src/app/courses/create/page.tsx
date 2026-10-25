'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { coursesService, modulesService, lessonsService, Course, CourseModule, Lesson } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Eye } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CreateCoursePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [step, setStep] = useState(1);

  // Course data
  const [courseData, setCourseData] = useState<{
    id?: string;
    title: string;
    slug: string;
    description: string;
    thumbnail: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    categoryId: string;
    price: number;
    durationHours: number;
    prerequisites: string[];
    learningObjectives: string[];
  }>({
    title: '',
    slug: '',
    description: '',
    thumbnail: '',
    level: 'BEGINNER',
    categoryId: '',
    price: 0,
    durationHours: 0,
    prerequisites: [''],
    learningObjectives: [''],
  });

  // Modules and lessons
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    loadCategories();
  }, [isAuthenticated, user, router]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/categories`);
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCourseChange = (field: string, value: any) => {
    setCourseData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'title') {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleArrayChange = (field: 'prerequisites' | 'learningObjectives', index: number, value: string) => {
    setCourseData((prev) => {
      const array = [...prev[field]];
      array[index] = value;
      return { ...prev, [field]: array };
    });
  };

  const addArrayItem = (field: 'prerequisites' | 'learningObjectives') => {
    setCourseData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field: 'prerequisites' | 'learningObjectives', index: number) => {
    setCourseData((prev) => {
      const array = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: array };
    });
  };

  const addModule = () => {
    const newModule: CourseModule = {
      id: `temp-${Date.now()}`,
      title: `Module ${modules.length + 1}`,
      description: '',
      order: modules.length,
      courseId: '',
      lessons: [],
    };
    setModules([...modules, newModule]);
    setSelectedModule(newModule.id);
  };

  const updateModule = (moduleId: string, field: string, value: any) => {
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, [field]: value } : m)));
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module and all its lessons?')) return;

    // If it's a saved module, delete from backend
    if (!moduleId.startsWith('temp-')) {
      try {
        await modulesService.deleteModule(moduleId);
      } catch (error) {
        console.error('Failed to delete module:', error);
        alert('Failed to delete module');
        return;
      }
    }

    setModules(modules.filter((m) => m.id !== moduleId));
    if (selectedModule === moduleId) {
      setSelectedModule(null);
    }
  };

  const addLesson = (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    const newLesson: Lesson = {
      id: `temp-${Date.now()}`,
      title: `Lesson ${(module.lessons?.length || 0) + 1}`,
      slug: '',
      content: '',
      type: 'TEXT',
      isRequired: true,
      moduleId,
      order: module.lessons?.length || 0,
    };

    setModules(
      modules.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...(m.lessons || []), newLesson] } : m
      )
    );
  };

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: any) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons?.map((l) => (l.id === lessonId ? { ...l, [field]: value } : l)),
          };
        }
        return m;
      })
    );
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;

    // If it's a saved lesson, delete from backend
    if (!lessonId.startsWith('temp-')) {
      try {
        await lessonsService.deleteLesson(lessonId);
      } catch (error) {
        console.error('Failed to delete lesson:', error);
        alert('Failed to delete lesson');
        return;
      }
    }

    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons?.filter((l) => l.id !== lessonId),
          };
        }
        return m;
      })
    );
  };

  const moveModule = async (index: number, direction: 'up' | 'down') => {
    const newModules = [...modules];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newModules.length) return;

    [newModules[index], newModules[newIndex]] = [newModules[newIndex], newModules[index]];

    // Update order values
    newModules.forEach((m, i) => (m.order = i));

    setModules(newModules);

    // If modules are saved, reorder on backend
    const savedModuleIds = newModules.filter((m) => !m.id.startsWith('temp-')).map((m) => m.id);
    if (savedModuleIds.length > 1) {
      try {
        await modulesService.reorderModules(savedModuleIds);
      } catch (error) {
        console.error('Failed to reorder modules:', error);
      }
    }
  };

  const moveLesson = async (moduleId: string, lessonIndex: number, direction: 'up' | 'down') => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module || !module.lessons) return;

    const newLessons = [...module.lessons];
    const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;

    if (newIndex < 0 || newIndex >= newLessons.length) return;

    [newLessons[lessonIndex], newLessons[newIndex]] = [newLessons[newIndex], newLessons[lessonIndex]];

    // Update order values
    newLessons.forEach((l, i) => (l.order = i));

    setModules(modules.map((m) => (m.id === moduleId ? { ...m, lessons: newLessons } : m)));

    // If lessons are saved, reorder on backend
    const savedLessonIds = newLessons.filter((l) => !l.id.startsWith('temp-')).map((l) => l.id);
    if (savedLessonIds.length > 1) {
      try {
        await lessonsService.reorderLessons(savedLessonIds);
      } catch (error) {
        console.error('Failed to reorder lessons:', error);
      }
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      // Save course
      let savedCourse: Course;
      if (courseData.id) {
        savedCourse = await coursesService.updateCourse(courseData.id, courseData);
      } else {
        savedCourse = await coursesService.createCourse(courseData);
        setCourseData((prev) => ({ ...prev, id: savedCourse.id }));
      }

      // Save modules
      for (const module of modules) {
        let savedModule: CourseModule;
        if (module.id.startsWith('temp-')) {
          savedModule = await modulesService.createModule({
            ...module,
            courseId: savedCourse.id,
          });
          // Update module ID in state
          setModules((prev) =>
            prev.map((m) => (m.id === module.id ? { ...m, id: savedModule.id } : m))
          );
        } else {
          savedModule = await modulesService.updateModule(module.id, {
            title: module.title,
            description: module.description,
          });
        }

        // Save lessons
        if (module.lessons) {
          for (const lesson of module.lessons) {
            if (lesson.id.startsWith('temp-')) {
              const savedLesson = await lessonsService.createLesson({
                ...lesson,
                moduleId: savedModule.id,
                slug: lesson.slug || generateSlug(lesson.title),
              });
              // Update lesson ID in state
              setModules((prev) =>
                prev.map((m) => {
                  if (m.id === savedModule.id) {
                    return {
                      ...m,
                      lessons: m.lessons?.map((l) =>
                        l.id === lesson.id ? { ...l, id: savedLesson.id } : l
                      ),
                    };
                  }
                  return m;
                })
              );
            } else {
              await lessonsService.updateLesson(lesson.id, {
                title: lesson.title,
                content: lesson.content,
                type: lesson.type,
                videoUrl: lesson.videoUrl,
                durationMinutes: lesson.durationMinutes,
                codeExample: lesson.codeExample,
                isRequired: lesson.isRequired,
              });
            }
          }
        }
      }

      alert('Course saved as draft!');
    } catch (error: any) {
      console.error('Failed to save course:', error);
      alert(error.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const publishCourse = async () => {
    if (!courseData.id) {
      alert('Please save the course as draft first');
      return;
    }

    if (modules.length === 0) {
      alert('Course must have at least one module');
      return;
    }

    const hasLessons = modules.some((m) => m.lessons && m.lessons.length > 0);
    if (!hasLessons) {
      alert('Course must have at least one lesson');
      return;
    }

    if (!confirm('Publish this course? It will be visible to all students.')) return;

    setLoading(true);
    try {
      await coursesService.publishCourse(courseData.id);
      alert('Course published successfully!');
      router.push('/dashboard/teacher');
    } catch (error: any) {
      console.error('Failed to publish course:', error);
      alert(error.response?.data?.message || 'Failed to publish course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/dashboard/teacher" className="text-2xl font-bold text-blue-600">
              JoyEdu
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveDraft} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button onClick={publishCourse} disabled={loading}>
                <Eye className="mr-2 h-4 w-4" />
                {loading ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Course</h1>
          <p className="text-gray-600">Build your course structure and content</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded ${
                step >= s ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the core details about your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={courseData.title}
                  onChange={(e) => handleCourseChange('title', e.target.value)}
                  placeholder="e.g., Complete Web Development Bootcamp"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={courseData.slug}
                  onChange={(e) => handleCourseChange('slug', e.target.value)}
                  placeholder="complete-web-development-bootcamp"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={courseData.description}
                  onChange={(e) => handleCourseChange('description', e.target.value)}
                  placeholder="Describe what students will learn..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={courseData.thumbnail}
                  onChange={(e) => handleCourseChange('thumbnail', e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Level *</Label>
                  <Select value={courseData.level} onValueChange={(value) => handleCourseChange('level', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={courseData.categoryId} onValueChange={(value) => handleCourseChange('categoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={courseData.price}
                    onChange={(e) => handleCourseChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={courseData.durationHours}
                    onChange={(e) => handleCourseChange('durationHours', parseFloat(e.target.value) || 0)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>Next: Learning Outcomes</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Learning Outcomes & Prerequisites</CardTitle>
              <CardDescription>Define what students will learn and what they need to know</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Learning Outcomes *</Label>
                <div className="space-y-2 mt-2">
                  {courseData.learningObjectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={objective}
                        onChange={(e) => handleArrayChange('learningObjectives', index, e.target.value)}
                        placeholder="e.g., Build responsive websites"
                      />
                      {courseData.learningObjectives.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeArrayItem('learningObjectives', index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => addArrayItem('learningObjectives')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Outcome
                  </Button>
                </div>
              </div>

              <div>
                <Label>Prerequisites</Label>
                <div className="space-y-2 mt-2">
                  {courseData.prerequisites.map((prereq, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={prereq}
                        onChange={(e) => handleArrayChange('prerequisites', index, e.target.value)}
                        placeholder="e.g., Basic HTML knowledge"
                      />
                      {courseData.prerequisites.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeArrayItem('prerequisites', index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => addArrayItem('prerequisites')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Prerequisite
                  </Button>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Next: Curriculum</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Curriculum</h2>
                <p className="text-gray-600">Organize your course into modules and lessons</p>
              </div>
              <Button onClick={addModule}>
                <Plus className="mr-2 h-4 w-4" />
                Add Module
              </Button>
            </div>

            {modules.length === 0 && (
              <Alert>
                Your course needs at least one module with lessons before it can be published.
              </Alert>
            )}

            {modules.map((module, moduleIndex) => (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Input
                        value={module.title}
                        onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                        className="text-lg font-semibold mb-2"
                        placeholder="Module Title"
                      />
                      <Textarea
                        value={module.description || ''}
                        onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                        placeholder="Module description..."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => moveModule(moduleIndex, 'up')} disabled={moduleIndex === 0}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => moveModule(moduleIndex, 'down')} disabled={moduleIndex === modules.length - 1}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteModule(module.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.lessons?.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="flex items-center gap-2 p-3 border rounded">
                        <Badge variant="secondary">{lesson.type}</Badge>
                        <Input
                          value={lesson.title}
                          onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                          className="flex-1"
                          placeholder="Lesson title"
                        />
                        <Button variant="ghost" size="icon" onClick={() => moveLesson(module.id, lessonIndex, 'up')} disabled={lessonIndex === 0}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => moveLesson(module.id, lessonIndex, 'down')} disabled={lessonIndex === (module.lessons?.length || 0) - 1}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteLesson(module.id, lesson.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => addLesson(module.id)} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Next: Review & Publish</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Publish</CardTitle>
              <CardDescription>Review your course before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Course Summary</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Title:</strong> {courseData.title}</p>
                  <p><strong>Level:</strong> {courseData.level}</p>
                  <p><strong>Price:</strong> ${courseData.price}</p>
                  <p><strong>Duration:</strong> {courseData.durationHours} hours</p>
                  <p><strong>Modules:</strong> {modules.length}</p>
                  <p><strong>Total Lessons:</strong> {modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)}</p>
                </div>
              </div>

              <Alert>
                <p className="text-sm">
                  Your course will be published as a draft first. You can make it public after adding content.
                </p>
              </Alert>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button onClick={saveDraft} disabled={saving}>
                  {saving ? 'Saving...' : 'Save as Draft'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
