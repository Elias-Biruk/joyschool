'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentsService, AssignmentSubmission } from '@/lib/assignments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function TeacherGradingPage({ params }: { params: { assignmentId: string } }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, { grade: number; feedback: string }>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadSubmissions();
  }, [isAuthenticated, params.assignmentId, router]);

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assignmentsService.getAssignmentSubmissions(params.assignmentId);
      setSubmissions(data);
      
      // Initialize grades with existing values
      const initialGrades: Record<string, { grade: number; feedback: string }> = {};
      data.forEach((sub) => {
        initialGrades[sub.id] = {
          grade: sub.grade || 0,
          feedback: sub.feedback || '',
        };
      });
      setGrades(initialGrades);
    } catch (err: any) {
      console.error('Failed to load submissions:', err);
      setError('Failed to load submissions. You may not have permission to grade this assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (submissionId: string, field: 'grade' | 'feedback', value: string | number) => {
    setGrades((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value,
      },
    }));
  };

  const handleSubmitGrade = async (submissionId: string) => {
    setGrading(submissionId);
    try {
      const gradeData = grades[submissionId];
      await assignmentsService.gradeAssignment(submissionId, gradeData.grade, gradeData.feedback);
      await loadSubmissions();
    } catch (err: any) {
      console.error('Failed to submit grade:', err);
      setError(err.response?.data?.message || 'Failed to submit grade');
    } finally {
      setGrading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Grade Submissions</h1>
          <Button onClick={() => router.back()}>Back</Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No submissions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {submission.user?.firstName} {submission.user?.lastName}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{submission.user?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {submission.isLate && <Badge variant="destructive">Late</Badge>}
                      {submission.grade !== undefined ? (
                        <Badge variant="default">Graded: {submission.grade}</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </div>

                  {submission.content && (
                    <div>
                      <h4 className="font-semibold mb-2">Student's Answer</h4>
                      <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {submission.content}
                      </div>
                    </div>
                  )}

                  {submission.fileUrl && (
                    <div>
                      <h4 className="font-semibold mb-2">Attached File</h4>
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View File
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Grade (Points)</label>
                      <input
                        type="number"
                        value={grades[submission.id]?.grade || 0}
                        onChange={(e) => handleGradeChange(submission.id, 'grade', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Feedback</label>
                      <Textarea
                        value={grades[submission.id]?.feedback || ''}
                        onChange={(e) => handleGradeChange(submission.id, 'feedback', e.target.value)}
                        placeholder="Enter your feedback..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSubmitGrade(submission.id)}
                    disabled={grading === submission.id}
                  >
                    {grading === submission.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Submit Grade'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
