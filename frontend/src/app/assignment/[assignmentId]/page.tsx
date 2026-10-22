'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentsService, Assignment, AssignmentSubmission } from '@/lib/assignments';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function AssignmentPage({ params }: { params: { assignmentId: string } }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadAssignment();
    loadMySubmissions();
  }, [isAuthenticated, params.assignmentId, router]);

  const loadAssignment = async () => {
    setLoading(true);
    setError(null);
    try {
      const assignmentData = await assignmentsService.getAssignmentById(params.assignmentId);
      setAssignment(assignmentData);
    } catch (err: any) {
      console.error('Failed to load assignment:', err);
      setError('Failed to load assignment. You may not have access to this assignment.');
    } finally {
      setLoading(false);
    }
  };

  const loadMySubmissions = async () => {
    try {
      const submissions = await assignmentsService.getMySubmissions();
      const existing = submissions.find((s) => s.assignmentId === params.assignmentId);
      if (existing) {
        setSubmission(existing);
        setContent(existing.content || '');
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await assignmentsService.submitAssignment(params.assignmentId, content);
      setSubmission(result);
    } catch (err: any) {
      console.error('Failed to submit assignment:', err);
      setError(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = assignment?.dueDate && new Date(assignment.dueDate) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Assignment not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <p className="text-gray-600 mt-2">{assignment.description}</p>
              </div>
              <div className="flex gap-2">
                {assignment.dueDate && (
                  <Badge variant={isOverdue ? 'destructive' : 'default'}>
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </Badge>
                )}
                <Badge>Max Points: {assignment.maxPoints}</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(assignment.instructions) }} />
            </div>
          </CardContent>
        </Card>

        {submission ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={submission.grade !== undefined ? 'default' : 'secondary'}>
                  {submission.grade !== undefined ? `Grade: ${submission.grade}/${assignment.maxPoints}` : 'Pending Review'}
                </Badge>
                {submission.isLate && <Badge variant="destructive">Late Submission</Badge>}
                <span className="text-sm text-gray-600">
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </span>
              </div>

              {submission.content && (
                <div>
                  <h4 className="font-semibold mb-2">Your Answer</h4>
                  <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
                    {submission.content}
                  </div>
                </div>
              )}

              {submission.feedback && (
                <div>
                  <h4 className="font-semibold mb-2">Teacher Feedback</h4>
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    {submission.feedback}
                  </div>
                </div>
              )}

              {submission.feedbacks && submission.feedbacks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Feedback History</h4>
                  {submission.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600 mb-1">
                        {feedback.teacher?.firstName} {feedback.teacher?.lastName} - {new Date(feedback.createdAt).toLocaleString()}
                      </p>
                      <p>{feedback.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Submit Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOverdue && !assignment.allowLateSubmission && (
                <Alert variant="destructive">
                  <AlertDescription>
                    This assignment is overdue and late submissions are not allowed.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Your Answer</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your answer here..."
                  rows={10}
                  disabled={isOverdue && !assignment.allowLateSubmission ? true : false}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !content || Boolean(isOverdue && !assignment.allowLateSubmission)}
                className="w-full"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Assignment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
