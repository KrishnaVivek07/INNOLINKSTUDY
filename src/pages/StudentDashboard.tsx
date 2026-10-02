import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
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
  Sparkles,
  Layers,
  ChevronRight,
  Activity,
  Check,
  Copy,
  Lock,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onNavigateToTest: (courseId: string, testId: string) => void;
  onViewCertificate: (courseId: string, certificateId?: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigateToCourse,
  onNavigateToLesson,
  onNavigateToTest,
  onViewCertificate,
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
  } = useLMS();

  const [keyInput, setKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

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
  const matchedEnrolled = courses.filter((c) =>
    enrolledCourseIds.includes(c.id) ||
    (studentRecord?.status === 'authorized' && (!studentRecord.courseId || studentRecord.courseId === c.id))
  );
  const enrolledCourses = matchedEnrolled.length > 0 ? matchedEnrolled : (studentRecord?.status === 'authorized' && courses.length > 0 ? [courses[0]] : []);

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

  // Overall Completion Calculation across enrolled courses
  const totalEnrolledLessons = enrolledCourses.reduce(
    (acc, c) => acc + lessons.filter((l) => l.courseId === c.id).length,
    0
  );
  const totalCompletedLessons = enrolledCourses.reduce(
    (acc, c) => acc + getCourseProgress(c.id).completedLessons.length,
    0
  );
  const overallProgressPercentage =
    totalEnrolledLessons > 0 ? Math.round((totalCompletedLessons / totalEnrolledLessons) * 100) : 0;

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

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-100 space-y-6">
      {/* 1. LEARNING PATHWAY HIERARCHY */}
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-cyan-400 font-semibold">Dashboard</span>
        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="hover:text-slate-200 transition">My Courses</span>
        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="hover:text-slate-200 transition">Course Details</span>
        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="hover:text-slate-200 transition">Learning Path</span>
        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="hover:text-slate-200 transition">Lesson & Lab</span>
        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="hover:text-slate-200 transition">Test / Assessment</span>
        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="text-emerald-400 font-semibold">Certification</span>
      </div>

      {/* 2. WELCOME HEADER & QUICK STATS */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Student Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {currentUser?.displayName || 'Scholar'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Track your hardware engineering curriculum, complete laboratory assignments, and verify competencies.
          </p>
        </div>

        {/* Quick Activation Key Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 md:w-80">
          <span className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Redeem Course Activation Key</span>
          </span>
          <form onSubmit={handleRedeem} className="flex gap-2">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="INNO-ELEC-XXXX"
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-cyan-300 uppercase font-mono placeholder:normal-case placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={redeeming || !keyInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-semibold text-white transition cursor-pointer"
            >
              {redeeming ? '...' : 'Activate'}
            </button>
          </form>
          {keyStatus && (
            <p className={`text-[11px] mt-1.5 ${keyStatus.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
              {keyStatus.text}
            </p>
          )}
        </div>
      </div>

      {/* AUTHORISED STUDENT COURSE PASS */}
      {studentRecord && (
        <div className="p-5 sm:p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorised Scholar • Paid Access Verified</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {studentRecord.email}
                </span>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {studentRecord.courseTitle || 'Hardware & Electronics Engineering Curriculum'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Your faculty mentor has approved your enrollment. Use your unique Course Key below to study lessons, complete assignments, and take certification tests.
                </p>
              </div>

              {/* Course Key Chip */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 font-mono">
                  <Key className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-400 font-sans">Course Key:</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-300 select-all tracking-wider">
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
                    className="ml-1 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Copy Course Key"
                  >
                    {copiedKey ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mentor Password: </span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {studentRecord.mentorPassword ? '••••••••' : 'Verified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Action Button to Study */}
            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (activeCourse) {
                    if (nextLesson) {
                      onNavigateToLesson(activeCourse.id, nextLesson.id);
                    } else {
                      onNavigateToCourse(activeCourse.id);
                    }
                  } else if (enrolledCourses.length > 0) {
                    onNavigateToCourse(enrolledCourses[0].id);
                  } else if (courses.length > 0) {
                    onNavigateToCourse(courses[0].id);
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Studying Course</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. OVERALL COURSE PROGRESS & METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overall Progress</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{overallProgressPercentage}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgressPercentage}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Enrolled Courses</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{enrolledCourses.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active Curriculums</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Upcoming Tests</span>
            <ClipboardList className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{pendingTests.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Module Assessments</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pending Labs</span>
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{pendingAssignments.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Practical Exercises</div>
        </div>
      </div>

      {/* 4. CONTINUE LEARNING SECTION */}
      {activeCourse ? (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Continue Learning
                </span>
                <span className="text-xs text-slate-400">{activeCourse.category}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white">
                {activeCourse.title}
              </h2>

              {nextLesson && (
                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                  <span className="text-cyan-400 font-semibold">Next Lecture:</span>
                  <span>{nextLesson.title}</span>
                </p>
              )}

              {/* Progress details */}
              <div className="max-w-md pt-1 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Course Completion</span>
                  <span className="text-cyan-400 font-bold">{activeProgress?.percentage || 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.max(2, activeProgress?.percentage || 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>
                    {activeProgress?.completedLessons.length || 0} of {activeLessons.length} Videos Completed
                  </span>
                  {activeProgress?.isCompleted && (
                    <span className="text-emerald-400 font-semibold">✓ Completed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {activeProgress?.isCompleted ? (
                <button
                  onClick={() => onViewCertificate(activeCourse.id, activeProgress.certificateId)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-400 transition"
                >
                  <Award className="w-4 h-4" />
                  <span>View Certificate</span>
                </button>
              ) : null}

              <button
                onClick={() => {
                  if (nextLesson) {
                    onNavigateToLesson(activeCourse.id, nextLesson.id);
                  } else {
                    onNavigateToCourse(activeCourse.id);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue Learning</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No active course in progress</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Browse the curriculum catalog or redeem your activation key to start learning.
          </p>
          <button
            onClick={() => onNavigateToCourse('')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      )}

      {/* 5. MY COURSES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">My Courses</h3>
            <p className="text-xs text-slate-400">Curriculums you are currently enrolled in</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold">{enrolledCourses.length} Enrolled</span>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">You are not enrolled in any course yet.</p>
            <button
              onClick={() => onNavigateToCourse('')}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition cursor-pointer"
            >
              Browse Course Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => {
              const progress = getCourseProgress(course.id);
              const courseLessons = lessons.filter((l) => l.courseId === course.id);
              return (
                <div
                  key={course.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="h-32 w-full overflow-hidden bg-slate-950 relative">
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950/80 text-cyan-300 border border-slate-800">
                        {course.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{course.title}</h4>
                      <p className="text-[11px] text-slate-400">{course.mentorName}</p>

                      <div className="pt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Progress</span>
                          <span className="font-semibold text-cyan-400">{progress.percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => onNavigateToCourse(course.id)}
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>View Course Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. UPCOMING TESTS & PENDING ASSIGNMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tests */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-cyan-400" />
              <span>Upcoming Tests</span>
            </h3>
            <span className="text-[11px] text-slate-400">{pendingTests.length} Pending</span>
          </div>

          {pendingTests.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              All currently available module tests are completed.
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingTests.slice(0, 3).map((test) => (
                <div
                  key={test.id}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">{test.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {test.questions.length} Questions • {test.durationMinutes}m • Pass: {test.passingScore}%
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateToTest(test.courseId, test.id)}
                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition cursor-pointer shrink-0"
                  >
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Assignments */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Pending Assignments</span>
            </h3>
            <span className="text-[11px] text-slate-400">{pendingAssignments.length} Awaiting</span>
          </div>

          {pendingAssignments.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No pending assignments. You are fully up to date!
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingAssignments.slice(0, 3).map((asg) => (
                <div
                  key={asg.id}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">{asg.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{asg.description}</p>
                  </div>
                  <button
                    onClick={() => onNavigateToLesson(asg.courseId, asg.lessonId || '')}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer shrink-0"
                  >
                    Submit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. RECENT ACTIVITY FEED */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Recent Activity & Assessment Results</span>
        </h3>

        {studentAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No recent test activity recorded yet. Complete a module quiz to view scores here.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {studentAttempts.slice(0, 4).map((attempt) => (
              <div key={attempt.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">Assessment Attempt</span>
                  <span className="text-slate-400 text-[11px] ml-2">
                    Score: {attempt.score} / {attempt.maxScore}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      attempt.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {attempt.percentage}% • {attempt.passed ? 'Passed' : 'Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
