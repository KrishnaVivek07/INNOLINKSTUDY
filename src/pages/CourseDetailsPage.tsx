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

interface CourseDetailsPageProps {
  courseId: string;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onBack: () => void;
  openAuthModal: (mode: 'student_login' | 'mentor_login' | 'register') => void;
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

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('892');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('Initiating secure gateway...');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState<string | null>(null);

  if (!course) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p>Course not found.</p>
        <button onClick={onBack} className="mt-4 text-cyan-400 underline">
          Back to Courses
        </button>
      </div>
    );
  }

  const handleStartPurchase = () => {
    if (!currentUser) {
      openAuthModal('student_login');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatusText('Communicating with InnoLink Payment Gateway...');

    try {
      // Step 1: Processing
      setTimeout(() => setPaymentStatusText('Authorizing transaction token...'), 600);
      setTimeout(() => setPaymentStatusText('Verifying payment securely on backend...'), 1200);

      const res = await purchaseCourse(course.id, paymentMethod);
      if (res.success) {
        setShowPaymentModal(false);
        // Automatically start the first lesson
        if (courseLessons.length > 0) {
          onNavigateToLesson(course.id, courseLessons[0].id);
        }
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment verification failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRedeemKeyModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
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
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-100">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 mb-6 transition cursor-pointer"
      >
        ← Back to Catalog
      </button>

      {/* Main Course Header Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10 border-b border-slate-800">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {course.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {course.level}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {course.duration}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {course.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {course.description}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-sm">
              KP
            </div>
            <div>
              <div className="text-xs text-slate-400">Course Lead & Mentor</div>
              <div className="text-sm font-bold text-white">{course.mentorName}</div>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="pt-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              What You Will Learn & Build
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {course.learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Purchase / Enrollment Box */}
        <div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sticky top-24">
            <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-slate-950">
              <img
                src={course.coverImage}
                alt={course.title}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-cyan-600/90 text-white flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 ml-1 fill-white" />
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <div>
                <span className="text-3xl font-extrabold text-white">${course.price}</span>
                <span className="text-xs text-slate-400 ml-2 line-through">${(course.price * 1.5).toFixed(2)}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Single One-Time Payment</span>
            </div>

            {enrolled ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All Modules & Videos Unlocked (Lifetime Access)</span>
                </div>
                <button
                  onClick={() => {
                    if (courseLessons.length > 0) {
                      onNavigateToLesson(course.id, courseLessons[0].id);
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs sm:text-sm font-semibold hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Learning Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Single payment unlocks ALL modules & videos</span>
                </div>

                <button
                  onClick={handleStartPurchase}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs sm:text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Buy All Modules (${course.price})</span>
                </button>

                <button
                  onClick={() => setShowKeyModal(true)}
                  className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Enter Course Activation Key</span>
                </button>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{courseLessons.length} On-Demand HD Video Lessons</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gemini AI Context-Aware Lesson Summaries</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mentor-Graded Circuit Lab Assignments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Official Verified Certificate of Completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Curriculum Modules & Lessons */}
      <div className="py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Course Curriculum</h2>
          <p className="text-xs text-slate-400 mt-1">
            {courseModules.length} Modules • {courseLessons.length} Lessons • Sequential Learning Path
          </p>
        </div>

        <div className="space-y-4">
          {courseModules.map((module, mIdx) => {
            const modLessons = courseLessons.filter((l) => l.moduleId === module.id);
            return (
              <div
                key={module.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden"
              >
                <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                      {mIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{module.title}</h3>
                      {module.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{module.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {modLessons.length} {modLessons.length === 1 ? 'Lesson' : 'Lessons'}
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {modLessons.map((lesson, lIdx) => (
                    <div
                      key={lesson.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-900/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-xs">
                          {enrolled ? (
                            <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-slate-200">
                            Video {lIdx + 1}: {lesson.title}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                            <span>{Math.round((lesson.videoDuration || 600) / 60)} mins</span>
                            <span>•</span>
                            <span className="text-cyan-400">AI Summary Included</span>
                          </div>
                        </div>
                      </div>

                      {enrolled ? (
                        <button
                          onClick={() => onNavigateToLesson(course.id, lesson.id)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition cursor-pointer"
                        >
                          Watch Lesson
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-500" />
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

      {/* PAYMENT GATEWAY MODAL (Simulated & Backend Verified) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 text-slate-100 shadow-2xl">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                InnoLink Secure Payment Gateway
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Unlock Course</h3>
            <p className="text-xs text-slate-400 mb-6 truncate">{course.title}</p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">Total Due</span>
                <span className="text-2xl font-extrabold text-white">${course.price}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                256-bit Encrypted
              </span>
            </div>

            {paymentError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {paymentError}
              </div>
            )}

            {isProcessingPayment ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-cyan-300 animate-pulse">
                  {paymentStatusText}
                </p>
                <p className="text-[11px] text-slate-400">
                  Please do not refresh or close this window.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPayment} className="space-y-4">
                {/* Method selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      paymentMethod === 'card'
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      paymentMethod === 'upi'
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      paymentMethod === 'netbanking'
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    NetBanking
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">CVC</label>
                        <input
                          type="password"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 text-center">
                    Instant verification available via backend authorization gateway.
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition shadow-lg shadow-emerald-600/25 cursor-pointer"
                >
                  Pay ${course.price} & Unlock Course
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ACTIVATION KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <Key className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Redeem Access Key</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Enter Course Key</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the unique key provided by your mentor or institution.
            </p>

            {keyStatus && (
              <div className="p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {keyStatus}
              </div>
            )}

            <form onSubmit={handleRedeemKeyModal} className="space-y-4">
              <input
                type="text"
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="INNO-ELEC-7K29-XP4A"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-cyan-300 font-mono tracking-wider focus:border-cyan-400 focus:outline-none uppercase"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition shadow-lg cursor-pointer"
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
