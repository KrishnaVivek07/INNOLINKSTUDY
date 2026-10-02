import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole, AuthorizedStudent, StudentAuthStatus, Enrollment, CourseAccessKey } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  role: UserRole;
  
  // Strict Student Registration & Mentor Authorization Pipeline
  registerStudentRequest: (
    name: string,
    email: string,
    phone?: string,
    courseId?: string,
    courseTitle?: string
  ) => Promise<{ status: StudentAuthStatus; message: string }>;
  
  validateStudentStepOne: (
    email: string,
    pass: string
  ) => Promise<{ student: AuthorizedStudent; generatedOtp: string }>;

  verifyStudentStepTwo: (
    email: string,
    otpInput: string
  ) => Promise<UserProfile>;

  loginMentor: (
    identifier: string,
    pass: string
  ) => Promise<UserProfile>;

  // Mentor Portal Credential Controls
  authorizedStudents: AuthorizedStudent[];
  authorizeStudentByMentor: (
    studentId: string,
    passwordToSet: string,
    customOtp?: string,
    courseKey?: string
  ) => Promise<AuthorizedStudent>;

  createAndAuthorizePaidStudent: (data: {
    name: string;
    email: string;
    phone?: string;
    courseId: string;
    courseTitle: string;
    password: string;
    otp?: string;
    courseKey?: string;
  }) => Promise<AuthorizedStudent>;
  
  updateStudentStatus: (
    studentId: string,
    status: StudentAuthStatus
  ) => Promise<void>;

  deleteStudentRequest: (studentId: string) => Promise<void>;

  logout: () => Promise<void>;
  resetMentorPasswordLocal: (newPass: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_MENTOR_EMAIL = 'karthikeyaprabhala2005@gmail.com';
const DEFAULT_MENTOR_USER = 'innolink';
const DEFAULT_MENTOR_PASS = 'kks@2026';

// Helper to auto-enroll student in localStorage
function syncStudentEnrollment(studentUid: string, studentEmail: string, courseId: string, keyUsed?: string) {
  try {
    const rawEnrollments = localStorage.getItem('innolink_enrollments');
    const enrollments: Enrollment[] = rawEnrollments ? JSON.parse(rawEnrollments) : [];
    const exists = enrollments.some(
      (e) => (e.studentId === studentUid || e.studentEmail === studentEmail) && e.courseId === courseId
    );
    if (!exists) {
      const newEnrollment: Enrollment = {
        id: `enroll-${Date.now()}`,
        studentId: studentUid,
        studentEmail,
        courseId,
        enrolledAt: new Date().toISOString(),
        paymentId: `PAID_AUTH_${Date.now()}`,
        accessKeyUsed: keyUsed,
        status: 'active',
      };
      localStorage.setItem('innolink_enrollments', JSON.stringify([newEnrollment, ...enrollments]));
    }

    // Save key in innolink_keys if keyUsed provided
    if (keyUsed) {
      const rawKeys = localStorage.getItem('innolink_keys');
      const keys: CourseAccessKey[] = rawKeys ? JSON.parse(rawKeys) : [];
      if (!keys.some((k) => k.key.toUpperCase() === keyUsed.toUpperCase())) {
        const newKey: CourseAccessKey = {
          id: `key-${Date.now()}`,
          key: keyUsed.toUpperCase(),
          courseId,
          mentorId: 'mentor-faculty',
          isUsed: true,
          usedBy: studentUid,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('innolink_keys', JSON.stringify([newKey, ...keys]));
      }
    }

    // Initialize course progress if not present
    const rawProgress = localStorage.getItem('innolink_progress');
    const progressList: any[] = rawProgress ? JSON.parse(rawProgress) : [];
    if (!progressList.some((p) => p.studentId === studentUid && p.courseId === courseId)) {
      const newProg = {
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
      localStorage.setItem('innolink_progress', JSON.stringify([newProg, ...progressList]));
    }
  } catch (err) {
    console.error('Failed to sync student enrollment:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  // Active Session User
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('innolink_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Authorized Students Registry (Strict Mentor-approved students)
  const [authorizedStudents, setAuthorizedStudents] = useState<AuthorizedStudent[]>(() => {
    const saved = localStorage.getItem('innolink_authorized_students');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync active user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('innolink_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('innolink_active_user');
    }
  }, [currentUser]);

  // Sync authorized students to localStorage
  useEffect(() => {
    localStorage.setItem('innolink_authorized_students', JSON.stringify(authorizedStudents));
  }, [authorizedStudents]);

  /**
   * 1. Student submits registration & course application
   */
  const registerStudentRequest = async (
    name: string,
    email: string,
    phone?: string,
    courseId?: string,
    courseTitle?: string
  ): Promise<{ status: StudentAuthStatus; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = authorizedStudents.find((s) => s.email.toLowerCase() === cleanEmail);

    if (existing) {
      if (existing.status === 'authorized') {
        throw new Error('An authorized account with this email already exists. Please sign in using your mentor-issued password.');
      }
      return {
        status: existing.status,
        message: 'Your registration is already received and is pending Faculty Mentor authorization in the Mentor Portal.',
      };
    }

    // Generate random 4-digit security OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Generate unique course activation key for this student
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedKey = `INNO-ELEC-${randomSuffix}`;

    const newStudent: AuthorizedStudent = {
      id: `student_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim(),
      courseId: courseId || 'course-elec-101',
      courseTitle: courseTitle || 'Electronics Engineering Curriculum',
      hasPaid: true,
      status: 'pending_mentor_approval',
      otpCode: generatedOtp,
      courseKey: generatedKey,
      registeredAt: new Date().toISOString(),
    };

    const updated = [newStudent, ...authorizedStudents];
    setAuthorizedStudents(updated);

    return {
      status: 'pending_mentor_approval',
      message: 'Registration submitted! Your enrollment is pending mentor authorization. The mentor will verify your payment, approve your email, assign your password, and issue your Course Key in the Mentor Portal.',
    };
  };

  /**
   * 2. Mentor authorises student, sets password and issues Course Key directly in the Mentor Portal
   */
  const authorizeStudentByMentor = async (
    studentId: string,
    passwordToSet: string,
    customOtp?: string,
    courseKey?: string
  ): Promise<AuthorizedStudent> => {
    if (!passwordToSet || passwordToSet.trim().length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const cleanPass = passwordToSet.trim();
    const fourDigitOtp = customOtp?.trim() || Math.floor(1000 + Math.random() * 9000).toString();

    let updatedStudent: AuthorizedStudent | null = null;

    const updated = authorizedStudents.map((st) => {
      if (st.id === studentId) {
        const finalKey =
          courseKey?.trim().toUpperCase() ||
          st.courseKey ||
          `INNO-ELEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        updatedStudent = {
          ...st,
          status: 'authorized',
          hasPaid: true,
          mentorPassword: cleanPass,
          otpCode: fourDigitOtp,
          courseKey: finalKey,
          authorizedAt: new Date().toISOString(),
          authorizedByMentor: currentUser?.displayName || 'Faculty Mentor',
        };

        // Automatically unlock and enroll this course in the student's learning profile
        if (updatedStudent.courseId) {
          syncStudentEnrollment(updatedStudent.id, updatedStudent.email, updatedStudent.courseId, finalKey);
        }

        return updatedStudent;
      }
      return st;
    });

    if (!updatedStudent) {
      throw new Error('Student record not found.');
    }

    setAuthorizedStudents(updated);
    return updatedStudent;
  };

  /**
   * 3. Mentor directly creates & authorises a new paid student
   */
  const createAndAuthorizePaidStudent = async (data: {
    name: string;
    email: string;
    phone?: string;
    courseId: string;
    courseTitle: string;
    password: string;
    otp?: string;
    courseKey?: string;
  }): Promise<AuthorizedStudent> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPass = data.password.trim();
    if (!cleanPass || cleanPass.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }

    const fourDigitOtp = data.otp?.trim() || Math.floor(1000 + Math.random() * 9000).toString();
    const finalCourseKey =
      data.courseKey?.trim().toUpperCase() ||
      `INNO-ELEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newStudentId = `student_${Date.now()}`;
    const newStudent: AuthorizedStudent = {
      id: newStudentId,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone?.trim(),
      courseId: data.courseId,
      courseTitle: data.courseTitle,
      hasPaid: true,
      status: 'authorized',
      mentorPassword: cleanPass,
      otpCode: fourDigitOtp,
      courseKey: finalCourseKey,
      registeredAt: new Date().toISOString(),
      authorizedAt: new Date().toISOString(),
      authorizedByMentor: currentUser?.displayName || 'Lead Faculty Mentor',
    };

    // Auto-enroll in course so they can immediately study
    syncStudentEnrollment(newStudentId, cleanEmail, data.courseId, finalCourseKey);

    // Filter out duplicate email if existed in pending
    const filtered = authorizedStudents.filter((s) => s.email.toLowerCase() !== cleanEmail);
    const updated = [newStudent, ...filtered];
    setAuthorizedStudents(updated);

    return newStudent;
  };

  /**
   * Mentor toggles or updates student status
   */
  const updateStudentStatus = async (studentId: string, status: StudentAuthStatus) => {
    setAuthorizedStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  /**
   * Mentor removes a rejected student request
   */
  const deleteStudentRequest = async (studentId: string) => {
    setAuthorizedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  /**
   * 4. Strict Student Login - Step 1: Validate Email & Mentor-Set Password
   */
  const validateStudentStepOne = async (
    email: string,
    pass: string
  ): Promise<{ student: AuthorizedStudent; generatedOtp: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    const student = authorizedStudents.find((s) => s.email.toLowerCase() === cleanEmail);

    if (!student) {
      throw new Error(
        'Access Denied: No student account found for this email. Please register and await mentor authorization.'
      );
    }

    if (student.status === 'pending_mentor_approval') {
      throw new Error(
        'Access Blocked: Your account is pending Mentor Authorization. Your faculty mentor must verify payment, authorize your email, and issue your password and Course Key in the Mentor Portal before you can log in.'
      );
    }

    if (student.status === 'rejected' || student.status === 'suspended') {
      throw new Error('Access Denied: Your account authorization has been suspended by the mentor.');
    }

    if (!student.mentorPassword || student.mentorPassword !== cleanPass) {
      throw new Error('Access Denied: Incorrect password. Please use the exact password authorized by your faculty mentor.');
    }

    // Refresh 4-digit OTP for this login challenge
    const freshOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setAuthorizedStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, otpCode: freshOtp } : s))
    );

    return {
      student: { ...student, otpCode: freshOtp },
      generatedOtp: freshOtp,
    };
  };

  /**
   * 5. Strict Student Login - Step 2: Validate 4-digit OTP
   */
  const verifyStudentStepTwo = async (
    email: string,
    otpInput: string
  ): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpInput.trim();

    const student = authorizedStudents.find((s) => s.email.toLowerCase() === cleanEmail);
    if (!student) {
      throw new Error('Session expired. Please start login again.');
    }

    if (student.otpCode !== cleanOtp) {
      throw new Error('Strict Security Rejection: Invalid 4-digit OTP. Unauthorized access prohibited.');
    }

    // Ensure student course enrollment is activated for studying
    if (student.courseId) {
      syncStudentEnrollment(student.id, student.email, student.courseId, student.courseKey);
    }

    const userProfile: UserProfile = {
      uid: student.id,
      email: student.email,
      displayName: student.name,
      role: 'student',
      isVerified: true,
      createdAt: student.registeredAt,
    };

    // Update last login timestamp
    setAuthorizedStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, lastLoginAt: new Date().toISOString() } : s))
    );

    setCurrentUser(userProfile);
    return userProfile;
  };

  /**
   * 6. Mentor Login - SINGLE EXCLUSIVE LOGIN
   */
  const loginMentor = async (identifier: string, pass: string): Promise<UserProfile> => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const savedMentorPass = localStorage.getItem('innolink_mentor_pwd') || DEFAULT_MENTOR_PASS;

    const isMentorUser =
      cleanId === DEFAULT_MENTOR_USER ||
      cleanId === DEFAULT_MENTOR_EMAIL.toLowerCase() ||
      cleanId === 'mentor' ||
      cleanId.includes('innolink');

    if (isMentorUser && pass === savedMentorPass) {
      const mentorProfile: UserProfile = {
        uid: 'mentor_innolink_faculty',
        email: DEFAULT_MENTOR_EMAIL,
        displayName: 'Prof. Karthik (Lead Mentor)',
        role: 'mentor',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(mentorProfile);
      return mentorProfile;
    }

    throw new Error('Access Denied: Invalid mentor credentials. Please verify your faculty username and password.');
  };

  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('innolink_active_user');
  };

  const resetMentorPasswordLocal = (newPass: string) => {
    if (newPass.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }
    localStorage.setItem('innolink_mentor_pwd', newPass);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        role: currentUser?.role || 'student',
        registerStudentRequest,
        validateStudentStepOne,
        verifyStudentStepTwo,
        loginMentor,
        authorizedStudents,
        authorizeStudentByMentor,
        createAndAuthorizePaidStudent,
        updateStudentStatus,
        deleteStudentRequest,
        logout,
        resetMentorPasswordLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
