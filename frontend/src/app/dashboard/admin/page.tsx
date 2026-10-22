'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminService, User, Course, PlatformStats } from '@/lib/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses'>('overview');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, coursesData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers({ limit: 10 }),
        adminService.getCourses({ limit: 10 }),
      ]);
      setStats(statsData);
      setUsers(usersData.data);
      setCourses(coursesData.data);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      loadAdminData();
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Failed to update user role');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    try {
      await adminService.suspendUser(userId);
      loadAdminData();
    } catch (err) {
      console.error('Failed to suspend user:', err);
      alert('Failed to suspend user');
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      await adminService.reactivateUser(userId);
      loadAdminData();
    } catch (err) {
      console.error('Failed to reactivate user:', err);
      alert('Failed to reactivate user');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border_b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
            <Button onClick={loadAdminData} className="w-full">Retry</Button>
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
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <Badge variant="destructive">Admin</Badge>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, courses, and platform settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
          >
            Users
          </Button>
          <Button
            variant={activeTab === 'courses' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('courses')}
          >
            Courses
          </Button>
        </div>

        {activeTab === 'overview' && stats && (
          <div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">Total Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCourses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">Total Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalEnrollments}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.activeUsers}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Latest registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Courses</CardTitle>
                  <CardDescription>Latest created courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.slice(0, 5).map((course) => (
                      <div key={course.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-gray-600">
                            {course.teacher?.firstName} {course.teacher?.lastName}
                          </p>
                        </div>
                        <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {course.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage platform users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex justify-between items-center py-4 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select
                        value={user.role}
                        onValueChange={(value) => value && handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="TEACHER">Teacher</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {user.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspendUser(user.id)}
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReactivateUser(user.id)}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'courses' && (
          <Card>
            <CardHeader>
              <CardTitle>Course Management</CardTitle>
              <CardDescription>Review and moderate platform courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="flex justify-between items-center py-4 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-gray-600">
                        {course.teacher?.firstName} {course.teacher?.lastName} • {course._count?.enrollments || 0} students
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                      <Link href={`/courses/${course.slug}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
