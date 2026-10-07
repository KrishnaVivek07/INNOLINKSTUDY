import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  Play,
  ArrowRight,
  ClipboardList,
  FileCheck,
  CheckCircle2,
  Key,
  ShieldCheck,
  ChevronRight,
  Activity,
  Check,
  Copy,
  Lock,
  CreditCard,
  RefreshCw,
  Mail,
  Loader2,
  AlertCircle,
  Code,
  ShoppingBag,
  Cpu,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onNavigateToTest: (courseId: string, testId: string) => void;
  onViewCertificate: (courseId: string, certificateId?: string) => void;
  onNavigateToTab?: (tab: string, param?: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigateToCourse,
  onNavigateToLesson,
  onNavigateToTest,
  onViewCertificate,
  onNavigateToTab,
}) => {
  const { currentUser, authorizedStudents } = useAuth();
  const {
    courses,
    lessons,
    enrollments,
    getCourseProgress,
    tests,
    testAttempts,
    assignments,
    submissions,
    redeemAccessKey,
    payments,
    resendCourseKey,
    getStudentPayments,
  } = useLMS();

  const { products } = useMarketplace();

  const [keyInput, setKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Secure Resend Course Key state per order
  const [resendingOrderId, setResendingOrderId] = useState<string | null>(null);
  const [resendStatusMap, setResendStatusMap] = useState<Record<string, { message: string; isError: boolean }>>({});
  const [resendCooldowns, setResendCooldowns] = useState<Record<string, number>>({});
  const [copiedKeyMap, setCopiedKeyMap] = useState<Record<string, boolean>>({});

  // Fetch verified payments on mount/auth
  useEffect(() => {
    getStudentPayments();
  }, [currentUser?.uid]);

  // Resend cooldown timer
  useEffect(() => {
    const hasCooldown = Object.values(resendCooldowns).some((c) => c > 0);
    if (!hasCooldown) return;
    const interval = setInterval(() => {
      setResendCooldowns((prev) => {
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v > 1) next[k] = v - 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldowns]);

  const handleResendKey = async (orderId: string) => {
    if (resendCooldowns[orderId] > 0 || resendingOrderId === orderId) return;
    setResendingOrderId(orderId);
    setResendStatusMap((prev) => ({ ...prev, [orderId]: { message: '', isError: false } }));

    try {
      const res = await resendCourseKey(orderId);
      setResendStatusMap((prev) => ({
        ...prev,
        [orderId]: {
          message: res.message || 'Course activation key sent to your registered email.',
          isError: false,
        },
      }));
      setResendCooldowns((prev) => ({ ...prev, [orderId]: 60 }));
    } catch (err: any) {
      setResendStatusMap((prev) => ({
        ...prev,
        [orderId]: {
          message: err.message || 'Failed to resend key. Please try again.',
          isError: true,
        },
      }));
    } finally {
      setResendingOrderId(null);
    }
  };

  // Match authorized student record for assigned course key
  const studentRecord = authorizedStudents.find(
    (s) =>
      s.id === currentUser?.uid ||
      s.email.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  // Student Enrolled Courses
  const studentUid = currentUser?.uid || '';
  const studentEnrollments = enrollments.filter(
    (e) => e.studentId === studentUid || e.studentEmail === currentUser?.email
  );

  const enrolledCourseIds = Array.from(
    new Set([
      ...studentEnrollments.map((e) => e.courseId),
      ...(studentRecord?.courseId ? [studentRecord.courseId] : []),
    ])
  );
  const matchedEnrolled = courses.filter(
    (c) =>
      enrolledCourseIds.includes(c.id) ||
      (studentRecord?.status === 'authorized' && (!studentRecord.courseId || studentRecord.courseId === c.id))
  );
  const enrolledCourses =
    matchedEnrolled.length > 0
      ? matchedEnrolled
      : studentRecord?.status === 'authorized' && courses.length > 0
      ? [courses[0]]
      : [];

  // Find most recent active course to show "Continue Learning"
  const activeCourse = enrolledCourses[0] || null;
  const activeProgress = activeCourse ? getCourseProgress(activeCourse.id) : null;
  const activeLessons = activeCourse ? lessons.filter((l) => l.courseId === activeCourse.id) : [];
  const nextLesson =
    activeLessons.find((l) => !activeProgress?.completedLessons.includes(l.id)) || activeLessons[0];

  // Upcoming Tests for Enrolled Courses
  const courseTests = tests.filter((t) => enrolledCourseIds.includes(t.courseId));
  const pendingTests = courseTests.filter(
    (t) => !testAttempts.some((a) => a.testId === t.id && a.passed)
  );

  // Pending Assignments for Enrolled Courses
  const courseAssignments = assignments.filter((a) => enrolledCourseIds.includes(a.courseId));
  const pendingAssignments = courseAssignments.filter(
    (a) => !submissions.some((s) => s.assignmentId === a.id)
  );

  // Student Test Attempts & History
  const studentAttempts = testAttempts.filter((a) => a.studentId === studentUid);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setRedeeming(true);
    setKeyStatus(null);
    try {
      const res = await redeemAccessKey(keyInput);
      setKeyStatus({ text: `Activated: ${res.courseTitle}!`, isError: false });
      setKeyInput('');
    } catch (err: any) {
      setKeyStatus({ text: err.message || 'Key invalid.', isError: true });
    } finally {
      setRedeeming(false);
    }
  };

  const displayName = currentUser?.displayName || 'Student';

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-[var(--foreground)] space-y-8 transition-colors duration-200">
      {/* 1. BREADCRUMBS */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted-text)] overflow-x-auto pb-0.5">
        <span className="font-semibold text-[var(--foreground)]">Dashboard</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
        <span>My Courses</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
        <span>Learning Path</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
        <span>Coding Lab</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
        <span>Certificates</span>
      </div>

      {/* 2. WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-1">
            Pick up where you left off in your electronics courses and practice in the virtual lab.
          </p>
        </div>

        {/* Quick Activation Key Box */}
        <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs shrink-0 md:w-80">
          <span className="text-xs font-semibold text-[var(--foreground)] block mb-1.5 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[var(--muted-text)]" />
            <span>Redeem Course Key</span>
          </span>
          <form onSubmit={handleRedeem} className="flex gap-2">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="INNO-ELEC-XXXX"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1.5 text-xs text-[var(--foreground)] uppercase font-mono placeholder:normal-case placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:bg-[var(--surface)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={redeeming || !keyInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-xs font-semibold text-[var(--background)] transition cursor-pointer"
            >
              {redeeming ? '...' : 'Activate'}
            </button>
          </form>
          {keyStatus && (
            <p className={`text-[11px] mt-1.5 ${keyStatus.isError ? 'text-rose-500' : 'text-emerald-500 font-medium'}`}>
              {keyStatus.text}
            </p>
          )}
        </div>
      </div>

      {/* 2.5 AUTHORIZED STUDENT PASS */}
      {studentRecord && (
        <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Authorized Scholar</span>
                </span>
                <span className="text-xs text-[var(--muted-text)] font-mono">{studentRecord.email}</span>
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)]">
                {studentRecord.courseTitle || 'Electronics Engineering Curriculum'}
              </h3>
              <p className="text-xs text-[var(--muted-text)]">
                Faculty verified access. Use your unique course key to access lessons and assessments.
              </p>

              {/* Course Key Chip */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-xs">
                  <span className="text-[var(--muted-text)] font-sans">Key:</span>
                  <span className="font-bold text-emerald-500 tracking-wider">
                    {studentRecord.courseKey || 'INNO-ELEC-ACTIVE'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (studentRecord.courseKey) {
                        navigator.clipboard.writeText(studentRecord.courseKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }
                    }}
                    className="text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
                    title="Copy Key"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (activeCourse) {
                  if (nextLesson) {
                    onNavigateToLesson(activeCourse.id, nextLesson.id);
                  } else {
                    onNavigateToCourse(activeCourse.id);
                  }
                } else if (enrolledCourses.length > 0) {
                  onNavigateToCourse(enrolledCourses[0].id);
                }
              }}
              className="px-4 py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-medium text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Course</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. CONTINUE LEARNING */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
          Continue Learning
        </h2>

        {activeCourse ? (
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <img
                  src={activeCourse.coverImage}
                  alt={activeCourse.title}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover bg-[var(--surface-secondary)] shrink-0 border border-[var(--border)]"
                />
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--muted-text)] uppercase tracking-wider">
                    {activeCourse.category}
                  </div>
                  <h3 className="text-base font-bold text-[var(--foreground)] leading-tight">
                    {activeCourse.title}
                  </h3>
                  {nextLesson && (
                    <p className="text-xs text-[var(--muted-text)] flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--foreground)]">Next:</span>
                      <span>{nextLesson.title}</span>
                    </p>
                  )}

                  {/* Clean progress bar */}
                  <div className="pt-2 max-w-xs space-y-1">
                    <div className="flex justify-between text-xs text-[var(--muted-text)]">
                      <span>Progress</span>
                      <span className="font-semibold text-[var(--foreground)]">{activeProgress?.percentage || 0}% complete</span>
                    </div>
                    <div className="h-1.5 w-48 sm:w-64 bg-[var(--surface-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                      <div
                        className="h-full bg-[var(--foreground)] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(2, activeProgress?.percentage || 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:self-center">
                {activeProgress?.isCompleted && (
                  <button
                    onClick={() => onViewCertificate(activeCourse.id, activeProgress.certificateId)}
                    className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Award className="w-3.5 h-3.5 text-[var(--muted-text)]" />
                    <span>Certificate</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (nextLesson) {
                      onNavigateToLesson(activeCourse.id, nextLesson.id);
                    } else {
                      onNavigateToCourse(activeCourse.id);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-medium text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-2">
            <BookOpen className="w-8 h-8 text-[var(--muted-text)] mx-auto" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">No active course in progress</h3>
            <p className="text-xs text-[var(--muted-text)] max-w-sm mx-auto">
              Enroll in a course or redeem an activation key to begin your learning path.
            </p>
            <button
              onClick={() => onNavigateToCourse('')}
              className="mt-2 px-4 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-xs font-semibold text-[var(--background)] transition cursor-pointer"
            >
              Browse Courses
            </button>
          </div>
        )}
      </section>

      {/* 4. YOUR COURSES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">Your Courses</h2>
          <span className="text-xs text-[var(--muted-text)] font-medium">{enrolledCourses.length} enrolled</span>
        </div>

        {enrolledCourses.length === 0 ? (
          <p className="text-xs text-[var(--muted-text)] py-3">You are not enrolled in any course yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => {
              const progress = getCourseProgress(course.id);
              return (
                <div
                  key={course.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[var(--muted-text)] transition"
                >
                  <div>
                    <div className="h-32 w-full overflow-hidden bg-[var(--surface-secondary)] relative">
                      <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface)]/95 text-[var(--foreground)] border border-[var(--border)]">
                        {course.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">{course.title}</h4>
                      <p className="text-xs text-[var(--muted-text)]">{course.mentorName}</p>

                      <div className="pt-2 space-y-1">
                        <div className="flex justify-between text-xs text-[var(--muted-text)]">
                          <span>Progress</span>
                          <span className="font-semibold text-[var(--foreground)]">{progress.percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--surface-secondary)] overflow-hidden border border-[var(--border)]">
                          <div className="h-full bg-[var(--foreground)] rounded-full" style={{ width: `${progress.percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => onNavigateToCourse(course.id)}
                      className="w-full py-1.5 rounded-lg bg-[var(--surface-secondary)] hover:opacity-80 border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>View Course</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. PRACTICE LABS */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">Practice Labs</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface-secondary)] text-[var(--foreground)]">
                  ESP32 Wi-Fi / BLE
                </span>
                <Cpu className="w-4 h-4 text-[var(--muted-text)]" />
              </div>
              <h4 className="text-sm font-bold text-[var(--foreground)] mt-2">ESP32 Firmware Lab</h4>
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                Dual LED blink, analog PWM fading, and Wi-Fi sensor telemetry on ESP32-WROOM.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('coding_lab')}
              className="mt-4 w-full py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Launch Lab</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface-secondary)] text-[var(--foreground)]">
                  Arduino Uno R3
                </span>
                <Cpu className="w-4 h-4 text-[var(--muted-text)]" />
              </div>
              <h4 className="text-sm font-bold text-[var(--foreground)] mt-2">Arduino Hardware Lab</h4>
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                HC-SR04 ultrasonic distance sensing, buzzer alarms, and digital I/O circuit wiring.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('coding_lab')}
              className="mt-4 w-full py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Launch Lab</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface-secondary)] text-[var(--foreground)]">
                  Raspberry Pi Pico
                </span>
                <Cpu className="w-4 h-4 text-[var(--muted-text)]" />
              </div>
              <h4 className="text-sm font-bold text-[var(--foreground)] mt-2">Pico RP2040 Lab</h4>
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                12-bit analog voltage sampling, potentiometer calibration, and RGB status LEDs.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('coding_lab')}
              className="mt-4 w-full py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Launch Lab</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. UPCOMING TESTS & ASSIGNMENTS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Tests */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-[var(--muted-text)]" />
              <span>Upcoming Tests</span>
            </h3>
            <span className="text-xs text-[var(--muted-text)] font-medium">{pendingTests.length} Pending</span>
          </div>

          {pendingTests.length === 0 ? (
            <p className="text-xs text-[var(--muted-text)] py-3 text-center">
              All currently available module tests are completed.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingTests.slice(0, 3).map((test) => (
                <div
                  key={test.id}
                  className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">{test.title}</h4>
                    <p className="text-[11px] text-[var(--muted-text)] mt-0.5">
                      {test.questions.length} Questions • {test.durationMinutes}m • Pass: {test.passingScore}%
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateToTest(test.courseId, test.id)}
                    className="px-3 py-1 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-xs font-semibold text-[var(--background)] transition cursor-pointer shrink-0"
                  >
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Assignments */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[var(--muted-text)]" />
              <span>Assignments</span>
            </h3>
            <span className="text-xs text-[var(--muted-text)] font-medium">{pendingAssignments.length} Awaiting</span>
          </div>

          {pendingAssignments.length === 0 ? (
            <p className="text-xs text-[var(--muted-text)] py-3 text-center">
              No pending assignments. You are fully up to date!
            </p>
          ) : (
            <div className="space-y-2">
              {pendingAssignments.slice(0, 3).map((asg) => (
                <div
                  key={asg.id}
                  className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">{asg.title}</h4>
                    <p className="text-[11px] text-[var(--muted-text)] mt-0.5 truncate">{asg.description}</p>
                  </div>
                  <button
                    onClick={() => onNavigateToLesson(asg.courseId, asg.lessonId || '')}
                    className="px-3 py-1 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-xs font-semibold text-[var(--background)] transition cursor-pointer shrink-0"
                  >
                    Submit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. RECOMMENDED STEM KITS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">Recommended STEM Kits</h2>
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('marketplace')}
            className="text-xs font-semibold text-[var(--foreground)] hover:underline flex items-center gap-1 transition cursor-pointer"
          >
            <span>Visit STEM Store</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {products.slice(0, 3).map((kit) => (
            <div
              key={kit.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[var(--muted-text)] transition"
            >
              <div>
                <div className="h-32 w-full bg-[var(--surface-secondary)] relative overflow-hidden">
                  <img src={kit.images[0]} alt={kit.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface)]/95 text-[var(--foreground)] border border-[var(--border)]">
                    {kit.boardPlatform || 'Hardware'}
                  </span>
                </div>
                <div className="p-3.5 space-y-1">
                  <h4 className="text-xs font-bold text-[var(--foreground)] line-clamp-1">{kit.title}</h4>
                  <p className="text-[11px] text-[var(--muted-text)] line-clamp-2 leading-relaxed">{kit.description}</p>
                  <div className="pt-2 text-xs font-bold text-[var(--foreground)]">${kit.price}</div>
                </div>
              </div>

              <div className="p-3.5 pt-0">
                <button
                  onClick={() => onNavigateToTab && onNavigateToTab('marketplace', kit.id)}
                  className="w-full py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>View Kit in Store</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. RECENT ACTIVITY */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">Recent Activity</h2>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          {studentAttempts.length === 0 ? (
            <p className="text-xs text-[var(--muted-text)] py-3 text-center">
              No recent quiz attempts recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {studentAttempts.slice(0, 4).map((attempt) => (
                <div key={attempt.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[var(--foreground)]">Module Quiz Attempt</span>
                    <span className="text-[var(--muted-text)] text-[11px] ml-2 font-mono">
                      Score: {attempt.score} / {attempt.maxScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--muted-text)]">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        attempt.passed
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}
                    >
                      {attempt.percentage}% • {attempt.passed ? 'Passed' : 'Needs Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 9. VERIFIED PAYMENTS & ACTIVATION KEYS */}
      <section className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified Course Payments & Activation Keys</span>
            </h3>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">
              Securely recorded billing references and course activation keys linked to your account
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] self-start sm:self-auto">
            {payments.filter((p) => p.studentId === currentUser?.uid || p.studentEmail?.toLowerCase() === currentUser?.email?.toLowerCase()).length} Verified
          </span>
        </div>

        {payments.filter((p) => p.studentId === currentUser?.uid || p.studentEmail?.toLowerCase() === currentUser?.email?.toLowerCase()).length === 0 ? (
          <div className="py-4 text-center text-xs text-[var(--muted-text)] space-y-1">
            <p>No course payment records found yet.</p>
            <p className="text-[11px] opacity-75">
              When you purchase a course via "Pay Now", your server-verified receipt and activation key appear here with email delivery status.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {payments
              .filter((p) => p.studentId === currentUser?.uid || p.studentEmail?.toLowerCase() === currentUser?.email?.toLowerCase())
              .map((payment) => {
                const cooldown = resendCooldowns[payment.orderId] || 0;
                const isResending = resendingOrderId === payment.orderId;
                const isCopied = copiedKeyMap[payment.orderId] || false;

                return (
                  <div key={payment.orderId} className="py-3 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                            {payment.courseTitle || 'Curriculum Course'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface-secondary)] text-[var(--foreground)]">
                            ${payment.amount} {payment.currency}
                          </span>
                          {payment.emailStatus === 'SENT' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Key Emailed</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              <span>Email Delivery Pending</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--muted-text)] mt-0.5 font-mono">
                          Ref: {payment.paymentId || payment.orderId}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isResending || cooldown > 0}
                          onClick={() => handleResendKey(payment.orderId)}
                          className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] disabled:opacity-50 text-xs font-semibold text-[var(--foreground)] transition flex items-center gap-1 cursor-pointer"
                        >
                          {isResending ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-[var(--foreground)]" />
                              <span>Sending...</span>
                            </>
                          ) : cooldown > 0 ? (
                            <>
                              <RefreshCw className="w-3 h-3 text-[var(--muted-text)]" />
                              <span>Resend ({cooldown}s)</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3 h-3 text-[var(--foreground)]" />
                              <span>Resend Key</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {payment.courseKey && (
                      <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-[var(--muted-text)] font-sans">Activation Key:</span>
                          <span className="font-bold text-[var(--foreground)] tracking-wider select-all">
                            {payment.courseKey}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (payment.courseKey) {
                                navigator.clipboard.writeText(payment.courseKey);
                                setCopiedKeyMap((prev) => ({ ...prev, [payment.orderId]: true }));
                                setTimeout(() => {
                                  setCopiedKeyMap((prev) => ({ ...prev, [payment.orderId]: false }));
                                }, 2000);
                              }
                            }}
                            className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition flex items-center gap-1 cursor-pointer"
                          >
                            {isCopied ? (
                              <span className="text-emerald-500 font-semibold">Copied!</span>
                            ) : (
                              <span>Copy</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateToCourse(payment.courseId)}
                            className="px-2 py-0.5 rounded bg-[var(--foreground)] text-[var(--background)] text-xs font-medium hover:opacity-90 transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Open Course</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
};
