import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Course,
  Module,
  Lesson,
  AISummary,
  Enrollment,
  CourseAccessKey,
  Test,
  TestAttempt,
  Assignment,
  Submission,
  CourseProgress,
  PaymentRecord,
} from '../types';
import {
  SEED_COURSES,
  SEED_MODULES,
  SEED_LESSONS,
  SEED_AI_SUMMARIES,
  SEED_TESTS,
  SEED_ASSIGNMENTS,
  SEED_KEYS,
} from '../data/seedData';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface LMSContextType {
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  aiSummaries: AISummary[];
  enrollments: Enrollment[];
  courseAccessKeys: CourseAccessKey[];
  payments: PaymentRecord[];
  tests: Test[];
  testAttempts: TestAttempt[];
  assignments: Assignment[];
  submissions: Submission[];
  progressRecords: CourseProgress[];
  
  // Student Actions
  purchaseCourse: (
    courseId: string,
    paymentMethod?: string,
    gatewayTransactionId?: string
  ) => Promise<{
    success: boolean;
    orderId: string;
    paymentId: string;
    courseKey: string;
    emailStatus: 'SENT' | 'PENDING' | 'FAILED';
    courseTitle: string;
    amount: number;
    currency: string;
    message: string;
  }>;
  redeemAccessKey: (keyString: string) => Promise<{ success: boolean; courseTitle: string; courseId?: string }>;
  resendCourseKey: (orderId: string) => Promise<{ success: boolean; message: string; emailStatus: 'SENT' | 'FAILED' | 'PENDING' }>;
  getStudentPayments: () => Promise<PaymentRecord[]>;
  isEnrolled: (courseId: string) => boolean;
  getCourseProgress: (courseId: string) => CourseProgress;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  recordWatchPercentage: (courseId: string, lessonId: string, percent: number) => void;
  submitTestAttempt: (attempt: Omit<TestAttempt, 'id' | 'completedAt'>) => Promise<TestAttempt>;
  submitAssignment: (assignmentId: string, courseId: string, content: string, submissionType?: 'text' | 'image' | 'pdf' | 'circuit_file') => Promise<void>;
  
  // Mentor Actions
  createCourse: (courseData: Omit<Course, 'id' | 'createdAt'>) => Promise<Course>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  createModule: (courseId: string, title: string, order: number, description?: string) => Promise<Module>;
  createLesson: (lessonData: Omit<Lesson, 'id' | 'createdAt'>) => Promise<Lesson>;
  updateLesson: (lessonId: string, updates: Partial<Lesson>) => Promise<void>;
  deleteLesson: (lessonId: string) => Promise<void>;
  generateAISummaryForLesson: (lesson: Lesson, courseTitle: string, moduleTitle: string) => Promise<AISummary>;
  updateAISummary: (summaryId: string, updates: Partial<AISummary>) => Promise<void>;
  publishLessonWithSummary: (lessonId: string, summaryId: string) => Promise<void>;
  createTest: (testData: Omit<Test, 'id' | 'createdAt'>) => Promise<Test>;
  createAssignment: (assignData: Omit<Assignment, 'id' | 'createdAt'>) => Promise<Assignment>;
  gradeSubmission: (submissionId: string, marks: number, feedback: string) => Promise<void>;
  generateCourseKey: (courseId: string, customKey?: string) => Promise<CourseAccessKey>;
  ensureCourseForStudent: (courseId: string, courseTitle: string) => Promise<Course>;
  clearAllData: () => void;
  
  // Helpers
  triggerCelebrationConfetti: () => void;
}

const LMSContext = createContext<LMSContextType | null>(null);

const CORE_INITIAL_COURSE: Course = {
  id: 'course-electronics-core',
  mentorId: 'mentor_innolink_faculty',
  mentorName: 'Prof. Karthik (Lead Mentor)',
  title: 'Hardware & Electronics Engineering Curriculum',
  description: 'Comprehensive curriculum covering circuit analysis, PCB schematics, microcontrollers, embedded systems, and laboratory testing.',
  price: 49.99,
  category: 'Hardware & Circuits',
  level: 'Beginner to Advanced',
  duration: '16 Modules • Full Lab Access',
  learningOutcomes: [
    'Understand circuit schematics and electrical governing equations',
    'Analyze hardware behavior under AC/DC loads',
    'Build and test real electronics prototypes on breadboards',
  ],
  coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  isPublished: true,
  createdAt: new Date().toISOString(),
};

const CORE_INITIAL_MODULES: Module[] = [
  {
    id: 'mod-core-1',
    courseId: 'course-electronics-core',
    title: 'Module 1: Orientation & Laboratory Setup',
    description: 'Hardware tools, safety protocols, and laboratory instruments overview.',
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mod-core-2',
    courseId: 'course-electronics-core',
    title: 'Module 2: Circuit Schematics & Components',
    description: 'Resistors, capacitors, semiconductors, and power supplies.',
    order: 2,
    createdAt: new Date().toISOString(),
  },
];

const CORE_INITIAL_LESSONS: Lesson[] = [
  {
    id: 'les-core-1',
    courseId: 'course-electronics-core',
    moduleId: 'mod-core-1',
    title: '1. Welcome to InnoLink & Laboratory Safety',
    description: 'Introduction to electronics engineering principles, equipment calibration, and prototype safety.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoDuration: 596,
    order: 1,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'les-core-2',
    courseId: 'course-electronics-core',
    moduleId: 'mod-core-1',
    title: '2. Oscilloscopes & Multimeter Calibration',
    description: 'Measuring voltage, current, and frequency on signal generators and DC circuits.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoDuration: 653,
    order: 2,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'les-core-3',
    courseId: 'course-electronics-core',
    moduleId: 'mod-core-2',
    title: '3. Transistor Switching & Logic Gate Circuits',
    description: 'BJT and MOSFET switching dynamics, pull-up resistors, and logic gate truth tables.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoDuration: 480,
    order: 1,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
];

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Local storage state keys
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('innolink_courses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return [CORE_INITIAL_COURSE];
  });

  const [modules, setModules] = useState<Module[]>(() => {
    const saved = localStorage.getItem('innolink_modules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return CORE_INITIAL_MODULES;
  });

  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('innolink_lessons');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return CORE_INITIAL_LESSONS;
  });

  const [aiSummaries, setAiSummaries] = useState<AISummary[]>(() => {
    const saved = localStorage.getItem('innolink_ai_summaries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((s: any) => s.id === 'sum-1' || s.courseId === 'course-elec-101')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    const saved = localStorage.getItem('innolink_enrollments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((e: any) => e.courseId === 'course-elec-101')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [courseAccessKeys, setCourseAccessKeys] = useState<CourseAccessKey[]>(() => {
    const saved = localStorage.getItem('innolink_keys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((k: any) => k.courseId === 'course-elec-101')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('innolink_payments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [tests, setTests] = useState<Test[]>(() => {
    const saved = localStorage.getItem('innolink_tests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((t: any) => t.courseId === 'course-elec-101')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>(() => {
    const saved = localStorage.getItem('innolink_test_attempts');
    return saved ? JSON.parse(saved) : [];
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('innolink_assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((a: any) => a.courseId === 'course-elec-101')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('innolink_submissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((s: any) => s.courseId === 'course-elec-101')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [progressRecords, setProgressRecords] = useState<CourseProgress[]>(() => {
    const saved = localStorage.getItem('innolink_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((p: any) => p.courseId === 'course-elec-101')) {
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('innolink_courses', JSON.stringify(courses));
  }, [courses]);
  useEffect(() => {
    localStorage.setItem('innolink_modules', JSON.stringify(modules));
  }, [modules]);
  useEffect(() => {
    localStorage.setItem('innolink_lessons', JSON.stringify(lessons));
  }, [lessons]);
  useEffect(() => {
    localStorage.setItem('innolink_ai_summaries', JSON.stringify(aiSummaries));
  }, [aiSummaries]);
  useEffect(() => {
    localStorage.setItem('innolink_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);
  useEffect(() => {
    localStorage.setItem('innolink_keys', JSON.stringify(courseAccessKeys));
  }, [courseAccessKeys]);
  useEffect(() => {
    localStorage.setItem('innolink_payments', JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    localStorage.setItem('innolink_tests', JSON.stringify(tests));
  }, [tests]);
  useEffect(() => {
    localStorage.setItem('innolink_test_attempts', JSON.stringify(testAttempts));
  }, [testAttempts]);
  useEffect(() => {
    localStorage.setItem('innolink_assignments', JSON.stringify(assignments));
  }, [assignments]);
  useEffect(() => {
    localStorage.setItem('innolink_submissions', JSON.stringify(submissions));
  }, [submissions]);
  useEffect(() => {
    localStorage.setItem('innolink_progress', JSON.stringify(progressRecords));
  }, [progressRecords]);

  // Helper celebration confetti
  const triggerCelebrationConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
      });
    } catch (e) {
      // Confetti fallback
    }
  };

  // Student Enrollment Check
  const isEnrolled = (courseId: string) => {
    if (!currentUser) return false;
    // Admin has full access
    if (currentUser.role === 'admin') return true;

    // Check direct enrollment
    const directlyEnrolled = enrollments.some(
      (e) =>
        (e.studentId === currentUser.uid ||
          e.studentEmail?.toLowerCase() === currentUser.email?.toLowerCase()) &&
        e.courseId === courseId
    );
    if (directlyEnrolled) return true;

    // Check if student was authorized by mentor in authorizedStudents registry
    try {
      const rawAuth = localStorage.getItem('innolink_authorized_students');
      if (rawAuth) {
        const authList: any[] = JSON.parse(rawAuth);
        const match = authList.find(
          (s) =>
            (s.id === currentUser.uid ||
              s.email?.toLowerCase() === currentUser.email?.toLowerCase()) &&
            s.status === 'authorized'
        );
        if (match) {
          if (!match.courseId || match.courseId === courseId) return true;
        }
      }
    } catch (e) {
      // pass
    }

    return false;
  };

  // Student Progress lookup
  const getCourseProgress = (courseId: string): CourseProgress => {
    const studentUid = currentUser?.uid || 'student-demo';
    const found = progressRecords.find((p) => p.studentId === studentUid && p.courseId === courseId);
    if (found) return found;

    return {
      id: `prog-${Date.now()}`,
      studentId: studentUid,
      courseId,
      completedLessons: [],
      completedTests: [],
      completedAssignments: [],
      percentage: 0,
      isCompleted: false,
      lastAccessedAt: new Date().toISOString(),
    };
  };

  // Course Purchase with Backend Verification
  const purchaseCourse = async (courseId: string, paymentMethod?: string, gatewayTransactionId?: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Course not found');
    if (!currentUser || !currentUser.email) {
      throw new Error('Please sign in to your student account with a verified email before completing checkout.');
    }

    const studentUid = currentUser.uid;
    const studentEmail = currentUser.email;
    const studentName = currentUser.displayName || 'Student';

    // 1. Create order on backend (frontend does NOT specify amount; backend determines from Firestore)
    const orderRes = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        studentId: studentUid,
        studentEmail,
        studentName,
      }),
    });
    if (!orderRes.ok) {
      const errData = await orderRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create payment order on server.');
    }
    const orderData = await orderRes.json();

    // 2. Perform payment transaction through gateway
    const paymentId = gatewayTransactionId || `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 3. Verify payment server-side (do NOT trust frontend alone)
    const verifyRes = await fetch('/api/payment/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderData.orderId,
        courseId,
        amount: orderData.amount,
        studentId: studentUid,
        studentEmail,
        studentName,
        timestamp: orderData.timestamp,
        signature: orderData.signature,
        paymentId,
        paymentStatus: 'success',
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.verified) {
      throw new Error(verifyData.error || 'Payment verification failed on the server.');
    }

    // 4. Record verified payment in state
    const newPaymentRecord: PaymentRecord = {
      id: verifyData.orderId,
      orderId: verifyData.orderId,
      paymentId: verifyData.paymentId,
      studentId: studentUid,
      studentEmail,
      studentName,
      courseId,
      courseTitle: verifyData.courseTitle || course.title,
      amount: verifyData.amount || orderData.amount,
      currency: verifyData.currency || 'USD',
      status: 'VERIFIED',
      verifiedAt: verifyData.verifiedAt || new Date().toISOString(),
      emailStatus: verifyData.emailStatus || 'PENDING',
      courseKey: verifyData.courseKey,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [newPaymentRecord, ...prev.filter((p) => p.orderId !== newPaymentRecord.orderId)]);

    // 5. Create or update Enrollment
    const newEnrollment: Enrollment = {
      id: `enroll-${verifyData.orderId}`,
      studentId: studentUid,
      studentEmail,
      courseId,
      enrolledAt: new Date().toISOString(),
      paymentId: verifyData.paymentId,
      accessKeyUsed: verifyData.courseKey,
      status: 'active',
    };

    setEnrollments((prev) => [newEnrollment, ...prev.filter((e) => !(e.courseId === courseId && (e.studentId === studentUid || e.studentEmail?.toLowerCase() === studentEmail.toLowerCase())))]);

    // 6. If a course key was issued, store in courseAccessKeys
    if (verifyData.courseKey) {
      const newKey: CourseAccessKey = {
        id: `key-${Date.now()}`,
        key: verifyData.courseKey,
        courseId,
        studentId: studentUid,
        studentEmail,
        mentorId: course.mentorId,
        isUsed: false,
        status: 'ACTIVE',
        orderId: verifyData.orderId,
        paymentId: verifyData.paymentId,
        createdAt: new Date().toISOString(),
      };
      setCourseAccessKeys((prev) => [newKey, ...prev.filter((k) => k.key.toUpperCase() !== newKey.key.toUpperCase())]);
    }

    // Initialize progress record
    setProgressRecords((prev) => {
      const exists = prev.find((p) => p.studentId === studentUid && p.courseId === courseId);
      if (exists) return prev;
      return [
        {
          id: `prog-${Date.now()}`,
          studentId: studentUid,
          courseId,
          completedLessons: [],
          completedTests: [],
          completedAssignments: [],
          percentage: 0,
          isCompleted: false,
          lastAccessedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });

    triggerCelebrationConfetti();

    return {
      success: true,
      orderId: verifyData.orderId,
      paymentId: verifyData.paymentId,
      courseKey: verifyData.courseKey,
      emailStatus: verifyData.emailStatus,
      courseTitle: verifyData.courseTitle || course.title,
      amount: verifyData.amount || orderData.amount,
      currency: verifyData.currency || 'USD',
      message: verifyData.message,
    };
  };

  // Redeem Course Access Key
  const redeemAccessKey = async (keyString: string) => {
    const formatted = keyString.trim().toUpperCase();
    if (!formatted) throw new Error('Please enter a course activation key.');

    const studentUid = currentUser?.uid || 'student-demo';
    const studentEmail = currentUser?.email || 'student@innolink.tech';

    let keyRecord = courseAccessKeys.find((k) => k.key.toUpperCase() === formatted);
    let targetCourseId = keyRecord?.courseId;

    // Check if key was issued to a student in authorizedStudents
    if (!targetCourseId) {
      try {
        const rawAuth = localStorage.getItem('innolink_authorized_students');
        if (rawAuth) {
          const authList: any[] = JSON.parse(rawAuth);
          const studentWithKey = authList.find(
            (s) => s.courseKey && s.courseKey.toUpperCase() === formatted
          );
          if (studentWithKey && studentWithKey.courseId) {
            targetCourseId = studentWithKey.courseId;
          }
        }
      } catch (e) {
        // pass
      }
    }

    // Check payments records
    if (!targetCourseId) {
      const paymentMatch = payments.find((p) => p.courseKey && p.courseKey.toUpperCase() === formatted);
      if (paymentMatch) {
        targetCourseId = paymentMatch.courseId;
      }
    }

    const course = (targetCourseId ? courses.find((c) => c.id === targetCourseId) : null) || courses[0];
    if (!course) throw new Error('Associated course not found for this key.');

    if (keyRecord && keyRecord.status === 'REVOKED') {
      throw new Error('This course activation key has been revoked. Please contact support.');
    }
    if (keyRecord && keyRecord.status === 'EXPIRED') {
      throw new Error('This course activation key has expired.');
    }

    // Mark key redeemed
    setCourseAccessKeys((prev) =>
      prev.map((k) =>
        k.key.toUpperCase() === formatted
          ? {
              ...k,
              isUsed: true,
              status: 'REDEEMED',
              usedBy: studentUid,
              redeemedAt: new Date().toISOString(),
            }
          : k
      )
    );

    // Create Enrollment
    const newEnrollment: Enrollment = {
      id: `enroll-key-${Date.now()}`,
      studentId: studentUid,
      studentEmail,
      courseId: course.id,
      enrolledAt: new Date().toISOString(),
      accessKeyUsed: formatted,
      status: 'active',
    };

    setEnrollments((prev) => {
      const already = prev.some(
        (e) =>
          (e.studentId === studentUid || e.studentEmail?.toLowerCase() === studentEmail.toLowerCase()) &&
          e.courseId === course.id
      );
      if (already) return prev;
      return [newEnrollment, ...prev];
    });

    triggerCelebrationConfetti();

    return {
      success: true,
      courseTitle: course.title,
      courseId: course.id,
    };
  };

  // Resend Course Key to student's verified email with rate limiting
  const resendCourseKey = async (orderId: string) => {
    if (!currentUser) throw new Error('Please sign in to resend your course key.');
    const res = await fetch('/api/payment/resend-course-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        studentId: currentUser.uid,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend course key.');
    }

    // Update in state
    setPayments((prev) =>
      prev.map((p) =>
        p.orderId === orderId
          ? { ...p, emailStatus: data.emailStatus || 'SENT', lastResentAt: new Date().toISOString() }
          : p
      )
    );

    return {
      success: true,
      message: data.message,
      emailStatus: data.emailStatus,
    };
  };

  // Get student verified payments from backend
  const getStudentPayments = async (): Promise<PaymentRecord[]> => {
    if (!currentUser) return payments;
    try {
      const res = await fetch(`/api/payment/student-payments/${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.payments) && data.payments.length > 0) {
          setPayments((prev) => {
            const map = new Map<string, PaymentRecord>();
            prev.forEach((p) => map.set(p.orderId, p));
            data.payments.forEach((p: PaymentRecord) => map.set(p.orderId, { ...map.get(p.orderId), ...p }));
            return Array.from(map.values());
          });
          return data.payments;
        }
      }
    } catch (e) {
      // ignore
    }
    return payments.filter((p) => p.studentId === currentUser.uid);
  };

  // Helper to ensure a course exists with lessons for an authorized student
  const ensureCourseForStudent = async (courseId: string, courseTitle: string): Promise<Course> => {
    const existing = courses.find((c) => c.id === courseId || c.title.toLowerCase() === courseTitle.toLowerCase());
    if (existing) return existing;

    const newCourse: Course = {
      id: courseId || `course-${Date.now()}`,
      mentorId: currentUser?.uid || 'mentor_innolink_faculty',
      mentorName: currentUser?.displayName || 'Faculty Mentor',
      title: courseTitle || 'Hardware & Electronics Engineering Curriculum',
      description: 'Comprehensive engineering curriculum with laboratory assignments, tests, and module verification.',
      price: 49.99,
      category: 'Hardware & Circuits',
      level: 'All Levels',
      duration: '16 Lessons • Hands-on Labs',
      learningOutcomes: [
        'Master core engineering principles and schematic analysis',
        'Build and test real electronics prototypes',
        'Verify hardware circuits with laboratory instruments',
      ],
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      isPublished: true,
      createdAt: new Date().toISOString(),
    };

    setCourses((prev) => [newCourse, ...prev]);

    const modId = `mod-${Date.now()}`;
    const newMod: Module = {
      id: modId,
      courseId: newCourse.id,
      title: 'Module 1: Foundations & Laboratory Setup',
      description: 'Orientation, safety protocols, and laboratory instruments overview.',
      order: 1,
      createdAt: new Date().toISOString(),
    };
    setModules((prev) => [...prev, newMod]);

    const newLesson: Lesson = {
      id: `les-${Date.now()}`,
      courseId: newCourse.id,
      moduleId: modId,
      title: '1. Welcome & Engineering Laboratory Introduction',
      description: 'Orientation to the InnoLink laboratory workspace, circuit schematics, and study goals.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      videoDuration: 596,
      order: 1,
      isPublished: true,
      createdAt: new Date().toISOString(),
    };
    setLessons((prev) => [...prev, newLesson]);

    return newCourse;
  };

  // Update progress helper
  const updateProgress = (courseId: string, updater: (p: CourseProgress) => CourseProgress) => {
    const studentUid = currentUser?.uid || 'student-demo';
    setProgressRecords((prev) => {
      const existing = prev.find((p) => p.studentId === studentUid && p.courseId === courseId) || {
        id: `prog-${Date.now()}`,
        studentId: studentUid,
        courseId,
        completedLessons: [],
        completedTests: [],
        completedAssignments: [],
        percentage: 0,
        isCompleted: false,
        lastAccessedAt: new Date().toISOString(),
      };

      const updated = updater(existing);

      // Calculate new percentage based on total lessons & tests in this course
      const courseLessons = lessons.filter((l) => l.courseId === courseId);
      const courseTests = tests.filter((t) => t.courseId === courseId);
      const totalItems = Math.max(1, courseLessons.length + courseTests.length);
      const completedCount = updated.completedLessons.length + updated.completedTests.length;
      const pct = Math.min(100, Math.round((completedCount / totalItems) * 100));

      updated.percentage = pct;
      if (pct === 100 && !updated.isCompleted) {
        updated.isCompleted = true;
        updated.completedAt = new Date().toISOString();
        updated.certificateId = `CERT-INNO-${courseId.toUpperCase().slice(-4)}-${Date.now().toString().slice(-6)}`;
        triggerCelebrationConfetti();
      }

      return prev.map((p) => (p.id === existing.id ? updated : p)).concat(
        prev.some((p) => p.id === existing.id) ? [] : [updated]
      );
    });
  };

  const markLessonComplete = (courseId: string, lessonId: string) => {
    updateProgress(courseId, (p) => {
      if (p.completedLessons.includes(lessonId)) return p;
      return {
        ...p,
        completedLessons: [...p.completedLessons, lessonId],
        lastAccessedAt: new Date().toISOString(),
      };
    });
  };

  const recordWatchPercentage = (courseId: string, lessonId: string, percent: number) => {
    if (percent >= 85) {
      markLessonComplete(courseId, lessonId);
    }
  };

  const submitTestAttempt = async (attemptData: Omit<TestAttempt, 'id' | 'completedAt'>) => {
    const newAttempt: TestAttempt = {
      ...attemptData,
      id: `attempt-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };

    setTestAttempts((prev) => [newAttempt, ...prev]);

    if (newAttempt.passed) {
      updateProgress(newAttempt.courseId, (p) => {
        if (p.completedTests.includes(newAttempt.testId)) return p;
        return {
          ...p,
          completedTests: [...p.completedTests, newAttempt.testId],
          lastAccessedAt: new Date().toISOString(),
        };
      });
      triggerCelebrationConfetti();
    }

    return newAttempt;
  };

  const submitAssignment = async (
    assignmentId: string,
    courseId: string,
    content: string,
    submissionType: 'text' | 'image' | 'pdf' | 'circuit_file' = 'text'
  ) => {
    const studentUid = currentUser?.uid || 'student-demo';
    const studentName = currentUser?.displayName || 'Student Scholar';

    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      assignmentId,
      courseId,
      studentId: studentUid,
      studentName,
      content,
      submissionType,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    setSubmissions((prev) => [newSub, ...prev]);

    updateProgress(courseId, (p) => {
      if (p.completedAssignments.includes(assignmentId)) return p;
      return {
        ...p,
        completedAssignments: [...p.completedAssignments, assignmentId],
        lastAccessedAt: new Date().toISOString(),
      };
    });
  };

  // Mentor Course Management
  const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt'>): Promise<Course> => {
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCourses((prev) => [newCourse, ...prev]);
    return newCourse;
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, ...updates } : c)));
  };

  const createModule = async (courseId: string, title: string, order: number, description?: string): Promise<Module> => {
    const newMod: Module = {
      id: `mod-${Date.now()}`,
      courseId,
      title,
      order,
      description,
      createdAt: new Date().toISOString(),
    };
    setModules((prev) => [...prev, newMod]);
    return newMod;
  };

  const createLesson = async (lessonData: Omit<Lesson, 'id' | 'createdAt'>): Promise<Lesson> => {
    const newLesson: Lesson = {
      ...lessonData,
      id: `les-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLessons((prev) => [...prev, newLesson]);
    return newLesson;
  };

  const updateLesson = async (lessonId: string, updates: Partial<Lesson>) => {
    setLessons((prev) => prev.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)));
  };

  const deleteLesson = async (lessonId: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  const generateAISummaryForLesson = async (
    lesson: Lesson,
    courseTitle: string,
    moduleTitle: string
  ): Promise<AISummary> => {
    const res = await fetch('/api/gemini/summarize-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonTitle: lesson.title,
        lessonDescription: lesson.description,
        transcriptOrNotes: lesson.notes,
        courseTitle,
        moduleTitle,
      }),
    });

    const data = await res.json();
    const newSummary: AISummary = {
      id: `sum-${lesson.id}-${Date.now()}`,
      lessonId: lesson.id,
      courseId: lesson.courseId,
      summary: data.summary,
      keyConcepts: data.keyConcepts || [],
      importantPoints: data.importantPoints || [],
      studyQuestions: data.studyQuestions || [],
      draftQuizQuestions: data.draftQuizQuestions || [],
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };

    setAiSummaries((prev) => [newSummary, ...prev.filter((s) => s.lessonId !== lesson.id)]);
    return newSummary;
  };

  const updateAISummary = async (summaryId: string, updates: Partial<AISummary>) => {
    setAiSummaries((prev) => prev.map((s) => (s.id === summaryId ? { ...s, ...updates } : s)));
  };

  const publishLessonWithSummary = async (lessonId: string, summaryId: string) => {
    setLessons((prev) => prev.map((l) => (l.id === lessonId ? { ...l, isPublished: true } : l)));
    setAiSummaries((prev) => prev.map((s) => (s.id === summaryId ? { ...s, status: 'published' } : s)));
  };

  const createTest = async (testData: Omit<Test, 'id' | 'createdAt'>): Promise<Test> => {
    const newTest: Test = {
      ...testData,
      id: `test-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTests((prev) => [newTest, ...prev]);
    return newTest;
  };

  const createAssignment = async (assignData: Omit<Assignment, 'id' | 'createdAt'>): Promise<Assignment> => {
    const newAssign: Assignment = {
      ...assignData,
      id: `assign-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAssignments((prev) => [newAssign, ...prev]);
    return newAssign;
  };

  const gradeSubmission = async (submissionId: string, marks: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              marks,
              feedback,
              status: 'reviewed',
              reviewedAt: new Date().toISOString(),
            }
          : s
      )
    );
  };

  const generateCourseKey = async (courseId: string, customKey?: string): Promise<CourseAccessKey> => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = customKey || `INNO-ELEC-${randomSuffix}-${randomCode}`;

    const newKeyRecord: CourseAccessKey = {
      id: `key-${Date.now()}`,
      key,
      courseId,
      mentorId: currentUser?.uid || 'mentor-karthik',
      isUsed: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      expiresAt: '2026-12-31T23:59:59.000Z',
    };

    setCourseAccessKeys((prev) => [newKeyRecord, ...prev]);
    return newKeyRecord;
  };

  const clearAllData = () => {
    localStorage.removeItem('innolink_courses');
    localStorage.removeItem('innolink_modules');
    localStorage.removeItem('innolink_lessons');
    localStorage.removeItem('innolink_ai_summaries');
    localStorage.removeItem('innolink_enrollments');
    localStorage.removeItem('innolink_keys');
    localStorage.removeItem('innolink_payments');
    localStorage.removeItem('innolink_tests');
    localStorage.removeItem('innolink_assignments');
    localStorage.removeItem('innolink_submissions');
    localStorage.removeItem('innolink_progress');
    setCourses([]);
    setModules([]);
    setLessons([]);
    setAiSummaries([]);
    setEnrollments([]);
    setCourseAccessKeys([]);
    setPayments([]);
    setTests([]);
    setTestAttempts([]);
    setAssignments([]);
    setSubmissions([]);
    setProgressRecords([]);
  };

  return (
    <LMSContext.Provider
      value={{
        courses,
        modules,
        lessons,
        aiSummaries,
        enrollments,
        courseAccessKeys,
        payments,
        tests,
        testAttempts,
        assignments,
        submissions,
        progressRecords,
        purchaseCourse,
        redeemAccessKey,
        resendCourseKey,
        getStudentPayments,
        isEnrolled,
        getCourseProgress,
        markLessonComplete,
        recordWatchPercentage,
        submitTestAttempt,
        submitAssignment,
        createCourse,
        updateCourse,
        createModule,
        createLesson,
        updateLesson,
        deleteLesson,
        generateAISummaryForLesson,
        updateAISummary,
        publishLessonWithSummary,
        createTest,
        createAssignment,
        gradeSubmission,
        generateCourseKey,
        ensureCourseForStudent,
        triggerCelebrationConfetti,
        clearAllData,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS must be used within an LMSProvider');
  }
  return context;
};
