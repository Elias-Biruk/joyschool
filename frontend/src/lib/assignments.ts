import api from './api';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  moduleId?: string;
  dueDate?: string;
  maxPoints: number;
  allowLateSubmission: boolean;
  order?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  content?: string;
  fileUrl?: string;
  submittedAt: string;
  gradedAt?: string;
  grade?: number;
  feedback?: string;
  isLate: boolean;
  assignment?: Assignment;
  feedbacks?: AssignmentFeedback[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AssignmentFeedback {
  id: string;
  submissionId: string;
  teacherId: string;
  content: string;
  createdAt: string;
  teacher?: {
    firstName: string;
    lastName: string;
  };
}

export const assignmentsService = {
  async getAssignmentById(id: string): Promise<Assignment> {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    const response = await api.get(`/assignments/course/${courseId}`);
    return response.data;
  },

  async submitAssignment(assignmentId: string, content?: string, fileUrl?: string): Promise<AssignmentSubmission> {
    const response = await api.post('/assignments/submit', {
      assignmentId,
      content,
      fileUrl,
    });
    return response.data;
  },

  async getMySubmissions(): Promise<AssignmentSubmission[]> {
    const response = await api.get('/assignments/my/submissions');
    return response.data;
  },

  async gradeAssignment(submissionId: string, grade: number, feedback?: string): Promise<AssignmentSubmission> {
    const response = await api.post('/assignments/grade', {
      submissionId,
      grade,
      feedback,
    });
    return response.data;
  },

  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    const response = await api.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  async deleteAssignment(id: string): Promise<void> {
    await api.delete(`/assignments/${id}`);
  },
};
