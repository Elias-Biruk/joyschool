'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { quizzesService, Quiz, Question, QuizAttempt } from '@/lib/quizzes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function QuizPage({ params }: { params: { quizId: string } }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadQuiz();
  }, [isAuthenticated, params.quizId, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft !== null && timeLeft > 0 && !showResults) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !showResults) {
      handleSubmit();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, showResults]);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const quizData = await quizzesService.getQuizById(params.quizId);
      setQuiz(quizData);
      if (quizData.timeLimitMinutes) {
        setTimeLeft(quizData.timeLimitMinutes * 60);
      }
    } catch (err: any) {
      console.error('Failed to load quiz:', err);
      setError('Failed to load quiz. You may not have access to this quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }));

      const result = await quizzesService.submitQuiz(params.quizId, answerArray);
      setAttempt(result);
      setShowResults(true);
    } catch (err: any) {
      console.error('Failed to submit quiz:', err);
      setError(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Quiz not found'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults && attempt) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Quiz Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{quiz.title}</h3>
                  <p className="text-sm text-gray-600">Attempt #{attempt.attemptNumber}</p>
                </div>
                <Badge variant={attempt.passed ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                  {attempt.passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Your Score</p>
                  <p className="text-2xl font-bold">{attempt.score.toFixed(1)}%</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Passing Score</p>
                  <p className="text-2xl font-bold">{quiz.passingScore}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Question Breakdown</h4>
                {attempt.responses.map((response) => {
                  const question = quiz.questions.find((q) => q.id === response.questionId);
                  return (
                    <div key={response.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm">{question?.questionText.substring(0, 50)}...</span>
                      <Badge variant={response.isCorrect ? 'default' : 'destructive'}>
                        {response.isCorrect ? `+${response.pointsEarned}` : '0'}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <Button onClick={() => router.back()} className="w-full">
                Back to Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                {quiz.description && <p className="text-gray-600 mt-2">{quiz.description}</p>}
              </div>
              {timeLeft !== null && (
                <Badge variant={timeLeft < 60 ? 'destructive' : 'default'} className="text-lg px-4 py-2">
                  {formatTime(timeLeft)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Questions: {totalQuestions}</span>
              <span>Answered: {answeredCount}/{totalQuestions}</span>
              <span>Passing Score: {quiz.passingScore}%</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {index + 1} ({question.points} points)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{question.questionText}</p>

                {question.type === 'MULTIPLE_CHOICE' && question.answerOptions && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    {question.answerOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id}>{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.type === 'TRUE_FALSE' && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="true" />
                      <Label htmlFor="true">True</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="false" />
                      <Label htmlFor="false">False</Label>
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
            className="w-full"
            size="lg"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
