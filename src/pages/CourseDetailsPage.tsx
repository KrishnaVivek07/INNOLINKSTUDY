import React, { useState } from 'react';
import { useLMS } from '../context/LMSContext';
import { useAuth } from '../context/AuthContext';
import { Course } from '../types';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Key,
  X,
  Play,
  FileText,
  User,
  Sparkles,
} from 'lucide-react';

import { PaymentGatewayModal } from '../components/PaymentGatewayModal';
import { PaymentStatusModal, PaymentStatusData } from '../components/PaymentStatusModal';

interface CourseDetailsPageProps {
  courseId: string;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onBack: () => void;
  openAuthModal: (mode: 'student_login' | 'admin_login' | 'register') => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({
  courseId,
  onNavigateToLesson,
  onBack,
  openAuthModal,
}) => {
  const { courses, modules, lessons, isEnrolled, purchaseCourse, redeemAccessKey } = useLMS();
  const { currentUser } = useAuth();

  const course = courses.find((c) => c.id === courseId);
  const courseModules = modules.filter((m) => m.courseId === courseId).sort((a, b) => a.order - b.order);
  const courseLessons = lessons.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order);

  const enrolled = course ? isEnrolled(course.id) : false;

  // Payment Gateway Modal State
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('Initiating secure gateway...');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Student Payment Status Flow Modal State
  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatusData | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState<string | null>(null);

  if (!course) {
    return (
      <div className="py-20 text-center text-[var(--foreground)] space-y-4">
        <h2 className="text-xl font-bold">Course Not Found</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold"
        >
          ← Return to Courses Catalog
        </button>
      </div>
    );
  }

  const handleStartPurchase = () => {
    if (!currentUser) {
      openAuthModal('student_login');
      return;
    }
    setPaymentError(null);
    setShowPaymentGatewayModal(true);
  };

  const handleConfirmPayment = async (method: 'card' | 'upi' | 'netbanking') => {
    if (!course) return;
    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatusText('Transmitting encrypted payment authorization...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      const paymentRecord = await purchaseCourse(course.id, method);

      setShowPaymentGatewayModal(false);
      setIsProcessingPayment(false);

      setPaymentStatusData({
        orderId: paymentRecord.orderId,
        paymentId: paymentRecord.paymentId,
        courseId: course.id,
        courseTitle: course.title,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency || 'USD',
        courseKey: paymentRecord.courseKey,
        emailStatus: paymentRecord.emailStatus,
        studentEmail: currentUser?.email || 'student@innolink.tech',
        verifiedAt: new Date().toISOString(),
      });
      setShowStatusModal(true);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing error. Card not charged.');
      setIsProcessingPayment(false);
    }
  };

  const handleRedeemKeyModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    if (!currentUser) {
      setShowKeyModal(false);
      openAuthModal('student_login');
      return;
    }

    try {
      await redeemAccessKey(keyInput);
      setShowKeyModal(false);
      if (courseLessons.length > 0) {
        onNavigateToLesson(course.id, courseLessons[0].id);
      }
    } catch (err: any) {
      setKeyStatus(err.message || 'Activation failed.');
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-[var(--foreground)] transition-colors duration-200">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-xs font-semibold text-[var(--muted-text)] hover:text-[var(--foreground)] flex items-center gap-1.5 mb-6 transition cursor-pointer"
      >
        ← Back to Catalog
      </button>

      {/* Main Course Header Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10 border-b border-[var(--border)]">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] shadow-xs">
              {course.category}
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[var(--surface)] text-[var(--muted-text)] border border-[var(--border)] shadow-xs">
              {course.level}
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[var(--surface)] text-[var(--muted-text)] border border-[var(--border)] shadow-xs">
              {course.duration}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight">
            {course.title}
          </h1>

          <p className="text-sm sm:text-base text-[var(--muted-text)] leading-relaxed">
            {course.description}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-9 h-9 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center font-bold text-[var(--foreground)] text-xs">
              IN
            </div>
            <div>
              <div className="text-[11px] text-[var(--muted-text)]">Course Lead & Faculty</div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{course.mentorName}</div>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="pt-4">
            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2.5">
              What You Will Learn & Build
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {course.learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[var(--muted-text)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-[var(--foreground)]">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Purchase / Enrollment Box */}
        <div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs sticky top-20">
            <div className="relative h-44 rounded-lg overflow-hidden mb-4 bg-[var(--surface-secondary)] border border-[var(--border)]">
              <img
                src={course.coverImage}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center shadow-md">
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <div>
                <span className="text-2xl font-bold text-[var(--foreground)]">${course.price}</span>
                <span className="text-xs text-[var(--muted-text)] ml-2 line-through">${(course.price * 1.5).toFixed(2)}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-500">One-Time Fee</span>
            </div>

            {enrolled ? (
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Modules & Videos Unlocked (Lifetime Access)</span>
                </div>
                <button
                  onClick={() => {
                    if (courseLessons.length > 0) {
                      onNavigateToLesson(course.id, courseLessons[0].id);
                    }
                  }}
                  className="w-full py-2.5 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs sm:text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Start Learning Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-text)] text-xs flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-[var(--muted-text)] shrink-0" />
                  <span>Single payment unlocks ALL modules & videos</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleStartPurchase}
                    className="py-2.5 px-3 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Now (${course.price})</span>
                  </button>

                  <button
                    onClick={() => setShowKeyModal(true)}
                    className="py-2.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Key className="w-3.5 h-3.5 text-[var(--muted-text)]" />
                    <span>Redeem Key</span>
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-[var(--border)] text-[11px] text-[var(--muted-text)] space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{courseLessons.length} Structured Video Lessons</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Gemini AI Context-Aware Lesson Summaries</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mentor-Graded Circuit Lab Assignments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Official Verified Certificate of Completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Curriculum Modules & Lessons */}
      <div className="py-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Course Curriculum</h2>
          <p className="text-xs text-[var(--muted-text)] mt-0.5">
            {courseModules.length} Modules • {courseLessons.length} Lessons • Sequential Learning Path
          </p>
        </div>

        <div className="space-y-3.5">
          {courseModules.map((module, mIdx) => {
            const modLessons = courseLessons.filter((l) => l.moduleId === module.id);
            return (
              <div
                key={module.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs"
              >
                <div className="p-3.5 bg-[var(--surface-secondary)] border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center font-bold text-xs">
                      {mIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">{module.title}</h3>
                      {module.description && (
                        <p className="text-[11px] text-[var(--muted-text)] mt-0.5">{module.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--muted-text)] font-mono">
                    {modLessons.length} {modLessons.length === 1 ? 'Lesson' : 'Lessons'}
                  </span>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {modLessons.map((lesson, lIdx) => (
                    <div
                      key={lesson.id}
                      className="p-3 sm:px-4 flex items-center justify-between hover:bg-[var(--surface-secondary)]/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-[var(--surface-secondary)] text-[var(--muted-text)] flex items-center justify-center text-xs">
                          {enrolled ? (
                            <Play className="w-3 h-3 text-[var(--foreground)] fill-current" />
                          ) : (
                            <Lock className="w-3 h-3 text-[var(--muted-text)]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                            Video {lIdx + 1}: {lesson.title}
                          </div>
                          <div className="text-[11px] text-[var(--muted-text)] flex items-center gap-2.5 mt-0.5">
                            <span>{Math.round((lesson.videoDuration || 600) / 60)} mins</span>
                            <span>•</span>
                            <span className="text-[var(--foreground)] font-medium">AI Summary Included</span>
                          </div>
                        </div>
                      </div>

                      {enrolled ? (
                        <button
                          onClick={() => onNavigateToLesson(course.id, lesson.id)}
                          className="px-3 py-1 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-xs font-medium text-[var(--background)] transition cursor-pointer"
                        >
                          Watch Lesson
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-[var(--muted-text)] flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAYMENT GATEWAY MODAL */}
      <PaymentGatewayModal
        isOpen={showPaymentGatewayModal}
        onClose={() => setShowPaymentGatewayModal(false)}
        course={course}
        verifiedStudentEmail={currentUser?.email || ''}
        studentName={currentUser?.displayName || 'Student'}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessingPayment}
        statusText={paymentStatusText}
        errorMessage={paymentError}
      />

      {/* STUDENT PAYMENT STATUS MODAL */}
      <PaymentStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        statusData={paymentStatusData}
        onGoToLearning={() => {
          setShowStatusModal(false);
          if (courseLessons.length > 0) {
            onNavigateToLesson(course.id, courseLessons[0].id);
          } else {
            onBack();
          }
        }}
        onRedeemKey={async (key) => {
          try {
            await redeemAccessKey(key);
            setShowStatusModal(false);
            if (courseLessons.length > 0) {
              onNavigateToLesson(course.id, courseLessons[0].id);
            }
          } catch (e) {
            setShowStatusModal(false);
          }
        }}
      />

      {/* ACTIVATION KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--foreground)] shadow-2xl">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-emerald-500">
              <Key className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Redeem Access Key</span>
            </div>

            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Enter Course Key</h3>
            <p className="text-xs text-[var(--muted-text)] mb-4">
              Enter the unique key provided by your mentor or institution.
            </p>

            {keyStatus && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {keyStatus}
              </div>
            )}

            <form onSubmit={handleRedeemKeyModal} className="space-y-4">
              <input
                type="text"
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="INNO-ELEC-XXXX"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2.5 text-xs text-[var(--foreground)] font-mono tracking-wider focus:border-[var(--foreground)] focus:outline-none uppercase"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-xs font-semibold text-[var(--background)] transition shadow-xs cursor-pointer"
              >
                Validate & Unlock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
