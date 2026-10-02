export type UserRole = 'student' | 'mentor';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  mentorId: string;
  mentorName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  level: string;
  duration: string;
  learningOutcomes: string[];
  coverImage?: string;
  isPublished: boolean;
  syllabus?: string[];
  createdAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl: string;
  videoDuration?: number; // in seconds
  order: number;
  isPublished: boolean;
  notes?: string;
  pdfUrl?: string;
  resources?: { name: string; url: string }[];
  createdAt: string;
}

export interface AISummary {
  id: string;
  lessonId: string;
  courseId: string;
  summary: string;
  keyConcepts: string[];
  importantPoints: string[];
  studyQuestions: string[];
  draftQuizQuestions?: {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }[];
  status: 'draft' | 'published';
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentEmail: string;
  courseId: string;
  enrolledAt: string;
  paymentId?: string;
  accessKeyUsed?: string;
  status: 'active' | 'completed';
}

export interface CourseAccessKey {
  id: string;
  key: string;
  courseId: string;
  mentorId: string;
  isUsed: boolean;
  usedBy?: string;
  createdAt: string;
  expiresAt?: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'numerical';

export interface TestQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  points?: number;
}

export interface Test {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  mentorId: string;
  title: string;
  instructions: string;
  durationMinutes: number;
  passingScore: number; // e.g. 70%
  isPublished: boolean;
  questions: TestQuestion[];
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string | number>;
  completedAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  mentorId: string;
  title: string;
  description: string;
  maxMarks: number;
  dueDate?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  content: string;
  submissionType?: 'text' | 'image' | 'pdf' | 'circuit_file';
  fileUrl?: string;
  marks?: number;
  feedback?: string;
  status: 'submitted' | 'reviewed';
  submittedAt: string;
  reviewedAt?: string;
}

export interface CourseProgress {
  id: string;
  studentId: string;
  courseId: string;
  completedLessons: string[];
  completedTests: string[];
  completedAssignments: string[];
  watchedPercentages?: Record<string, number>;
  percentage: number;
  isCompleted: boolean;
  completedAt?: string;
  certificateId?: string;
  lastAccessedAt: string;
}

export type AppTheme = 'dark' | 'light' | 'system';

export type StudentAuthStatus = 'pending_mentor_approval' | 'authorized' | 'rejected' | 'suspended';

export interface AuthorizedStudent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  courseId?: string;
  courseTitle?: string;
  hasPaid: boolean;
  paymentRef?: string;
  status: StudentAuthStatus;
  mentorPassword?: string; // The password set by the mentor for this student
  courseKey?: string; // The unique course key given to the student to study the course
  otpCode: string; // The strict 4-digit OTP code (e.g., "7391")
  registeredAt: string;
  authorizedAt?: string;
  authorizedByMentor?: string;
  lastLoginAt?: string;
}

export interface WorkspaceDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
}

export interface WorkspaceGmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  sender: string;
  subject: string;
  date: string;
  unread: boolean;
}

export interface WorkspaceMeetSession {
  id: string;
  name: string;
  meetingUri: string;
  meetingCode: string;
  topic: string;
  mentorName: string;
  scheduledTime?: string;
  createdAt: string;
}
