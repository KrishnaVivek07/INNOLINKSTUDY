import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import {
  Cpu,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  BarChart3,
  HelpCircle,
  MessageSquare,
  Zap,
  Play,
  BrainCircuit,
  GraduationCap,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string, param?: string) => void;
  openAuthModal: (mode: 'student_login' | 'mentor_login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, openAuthModal }) => {
  const { currentUser } = useAuth();
  const { courses, isEnrolled } = useLMS();

  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden">
      {/* Circuit background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-12 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-24 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        {/* Subtle SVG Circuit Grid overlay */}
        <svg className="w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#38bdf8" strokeWidth="0.7" />
              <circle cx="0" cy="0" r="2" fill="#38bdf8" />
              <path d="M 30 0 v 30 h 30" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2,2" />
              <circle cx="30" cy="30" r="1.5" fill="#34d399" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-grid)" />
        </svg>
      </div>

      {/* 1. HERO SECTION */}
      <section className="pt-14 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-semibold mb-6 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Next-Generation Electronics Learning Platform</span>
        </div>

        {/* Brand Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4">
          <span className="block">InnoLink Technologies</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 mt-2">
            Learn Electronics. Build Skills. Create the Future.
          </span>
        </h1>

        {/* Motto */}
        <p className="text-base sm:text-xl font-medium text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
          Learn. Build. Test. Innovate.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
          <button
            onClick={() => onNavigate('courses')}
            className="flex-1 min-w-[150px] sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm sm:text-base hover:from-cyan-400 hover:to-blue-500 shadow-xl shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Explore Courses</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!currentUser ? (
            <>
              <button
                onClick={() => openAuthModal('student_login')}
                className="flex-1 min-w-[140px] sm:flex-none px-6 py-3 rounded-2xl border border-slate-700 bg-slate-900/80 text-slate-200 font-semibold text-sm sm:text-base hover:border-slate-500 hover:text-white transition cursor-pointer"
              >
                Student Login
              </button>

              <button
                onClick={() => openAuthModal('mentor_login')}
                className="flex-1 min-w-[140px] sm:flex-none px-6 py-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 font-semibold text-sm sm:text-base hover:bg-emerald-900/50 hover:border-emerald-400 transition cursor-pointer"
              >
                Mentor Login
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate(currentUser.role === 'mentor' ? 'mentor_dashboard' : 'student_dashboard')}
              className="flex-1 min-w-[180px] sm:flex-none px-6 py-3 rounded-2xl bg-slate-800 text-cyan-300 border border-cyan-500/40 font-semibold text-sm sm:text-base hover:bg-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Go to Your {currentUser.role === 'mentor' ? 'Mentor' : 'Student'} Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hardware Pillar Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto pt-8 border-t border-slate-800/60">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-left">
            <Cpu className="w-5 h-5 text-cyan-400 mb-2" />
            <div className="text-sm font-bold text-white">Circuit Mastery</div>
            <div className="text-xs text-slate-400 mt-1">From DC basics to high-frequency RF routing</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-left">
            <BrainCircuit className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-sm font-bold text-white">Gemini AI Tutor</div>
            <div className="text-xs text-slate-400 mt-1">Contextual Q&A and instant video summaries</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-left">
            <ShieldCheck className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-sm font-bold text-white">Faculty Guided</div>
            <div className="text-xs text-slate-400 mt-1">Lead engineer reviews, grading & code notes</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-left">
            <Award className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-sm font-bold text-white">PWA & Certifications</div>
            <div className="text-xs text-slate-400 mt-1">Install on desktop/mobile + verified certificates</div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED COURSES SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
              Curriculum Catalog
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Featured Electronics Courses
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Practical, syllabus-aligned courses with video demonstrations, schematic exercises, and mentor-evaluated labs.
            </p>
          </div>
          <button
            onClick={() => onNavigate('courses')}
            className="mt-4 sm:mt-0 text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Browse Full Catalog ({courses.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
              <div
                key={course.id}
                className="group rounded-3xl border border-slate-800 bg-slate-900/70 overflow-hidden flex flex-col hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 shadow-lg"
              >
                {/* Cover Image */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 text-cyan-300 border border-slate-700/80 backdrop-blur-sm">
                    {course.category}
                  </span>
                  {enrolled ? (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                      ✓ Enrolled
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 text-slate-300 border border-slate-800">
                      ${course.price}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{course.duration}</span>
                      <span className="text-slate-300 font-medium">{course.level}</span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => onNavigate('course_details', course.id)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-600 text-xs font-semibold text-white transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{enrolled ? 'Continue Course' : 'View Course & Curriculum'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. HOW LEARNING WORKS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            Proven Methodology
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How Learning Works at InnoLink
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Structured 4-step progressive mastery cycle tailored for hardware and electronics disciples.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 relative">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-white mb-2">Mentor Video Lessons</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Watch step-by-step oscilloscope traces, component soldering, and schematic derivations presented by veteran mentors.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 relative">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h3 className="text-base font-bold text-white mb-2">Gemini AI Study Notes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reviewed key concepts, formula cheat-sheets, and instant context-aware Q&A for every lesson you study.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 relative">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-white mb-2">Assessments & Labs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pass timed module assessments and submit real breadboard circuit photos or calculations for mentor grading.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 relative">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm mb-4">
              04
            </div>
            <h3 className="text-base font-bold text-white mb-2">Certified Mastery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Achieve 100% path completion and earn an official verifiable InnoLink Technologies certificate.
            </p>
          </div>
        </div>
      </section>

      {/* 4. AI-POWERED LEARNING SHOWCASE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Google Gemini 3.8</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Context-Aware AI Tutor Built into Every Lesson
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Stuck on why a BJT collector voltage saturates or how capacitor ripple factor behaves under load?
              Our integrated AI tutor is grounded in your current lesson curriculum, providing precise, mentor-vetted answers without fluff.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Automatic AI lesson summaries reviewed and approved by faculty mentors before publishing.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Contextual "Ask AI about this lesson" tab directly in the video player.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>AI-assisted draft quiz questions tested and refined by engineers.</span>
              </div>
            </div>
          </div>

          {/* Interactive AI Preview Box */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-white">Ask Gemini About This Lesson</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono">Lesson 05: Transistor Biasing</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300">
                <span className="text-slate-400 font-sans text-[11px] block mb-1">Student asked:</span>
                “Why does collector current change when base-emitter voltage exceeds 0.7V?”
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200">
                <span className="text-cyan-400 font-sans text-[11px] font-bold block mb-1">
                  Gemini Tutor Response:
                </span>
                <p className="leading-relaxed font-sans text-xs">
                  At 0.7V forward bias in silicon, the base-emitter depletion barrier collapses. This injects abundant electrons from the heavily doped emitter into the thin base. Because the base is narrow and reverse-biased by V_CC, &gt;98% of these electrons are swept across into the collector, causing exponential collector current I_C = I_S * e^(V_BE / V_T).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STUDENT PROGRESS & LEARNING PATH PREVIEW */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            Visual Roadmap
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Animated Learning Path Tracking
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            No guessing where to go next. Interactive progress nodes unlock sequentially as you complete lessons and score passing grades on tests.
          </p>
        </div>

        {/* Path Mockup Graphic */}
        <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="text-xs font-semibold text-white mt-2">Module 1</span>
            <span className="text-[10px] text-emerald-400">Completed (100%)</span>
          </div>

          <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full hidden sm:block" />

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold animate-pulse">
              ▶
            </div>
            <span className="text-xs font-semibold text-white mt-2">Module 2</span>
            <span className="text-[10px] text-cyan-400">Active (72%)</span>
          </div>

          <div className="w-16 h-1 bg-slate-800 rounded-full hidden sm:block" />

          <div className="flex flex-col items-center opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300 mt-2">Module 3</span>
            <span className="text-[10px] text-slate-400">Pass Test to Unlock</span>
          </div>

          <div className="w-16 h-1 bg-slate-800 rounded-full hidden sm:block" />

          <div className="flex flex-col items-center opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              🏆
            </div>
            <span className="text-xs font-semibold text-slate-300 mt-2">Final Certification</span>
            <span className="text-[10px] text-slate-400">100% Required</span>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/60">
        <div className="text-center mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            Clarifications
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h4 className="text-sm font-bold text-white mb-1">How do course access activation keys work?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mentors can generate unique activation keys (e.g. <code className="text-cyan-400">INNO-ELEC-7K29-XP4A</code>) for students enrolled through institutions or offline workshops. You can redeem this key in your Student Dashboard or on the course purchase page to instantly unlock lessons.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h4 className="text-sm font-bold text-white mb-1">Can I install InnoLink as an app on my phone?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes! InnoLink Technologies is fully compliant as a Progressive Web App (PWA). Click the "Install App" button in the header on Chrome/Android, or tap "Share &gt; Add to Home Screen" on iOS Safari to use it as a native mobile app.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h4 className="text-sm font-bold text-white mb-1">How are assignments graded?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Students submit practical homework (circuit schematics, calculations, or lab photos). Mentors inspect submissions directly in their portal, award marks, and provide detailed written engineering feedback.
            </p>
          </div>
        </div>
      </section>

      {/* 7. CONTACT / MENTOR INQUIRY SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-800/60">
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Ready to Build Your Engineering Career?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mb-6">
            Join InnoLink Technologies today. Get personalized mentorship, AI study companions, and hands-on electronics mastery.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => openAuthModal('register')}
              className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition shadow-lg shadow-cyan-600/25 cursor-pointer"
            >
              Register as Student
            </button>
            <button
              onClick={() => openAuthModal('mentor_login')}
              className="px-6 py-3 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition cursor-pointer"
            >
              Mentor Portal Access
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
