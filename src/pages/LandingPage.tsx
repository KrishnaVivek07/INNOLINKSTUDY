import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { useBranding } from '../context/BrandingContext';
import {
  Cpu,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  ShoppingBag,
  Code,
  Terminal,
  Activity,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string, param?: string) => void;
  openAuthModal: (mode: 'student_login' | 'admin_login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, openAuthModal }) => {
  const { currentUser } = useAuth();
  const { courses, isEnrolled } = useLMS();
  const { branding } = useBranding();

  return (
    <div className="min-h-screen text-[var(--foreground)] bg-[var(--background)] transition-colors duration-200">
      {/* 1. HERO SECTION */}
      <section className="pt-14 sm:pt-20 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Subtle Category Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-text)] text-xs font-medium mb-6 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branding.primaryAccent || '#10B981' }} />
          <span>Electronics Education & Engineering Practice</span>
        </div>

        {/* Clear, Confident Main Title */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--foreground)] mb-4 max-w-3xl mx-auto">
          Learn Electronics. Build Circuits. Master Embedded Systems.
        </h1>

        {/* Professional Subtitle */}
        <p className="text-sm sm:text-base text-[var(--muted-text)] max-w-2xl mx-auto mb-8 leading-relaxed">
          {branding.platformName} provides university-grade electronics curriculum, virtual microcontroller labs for ESP32, Arduino, and Pico, and verified STEM kits.
        </p>

        {/* Clean Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={() => onNavigate('courses')}
            className="flex-1 min-w-[140px] sm:flex-none px-5 py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-medium text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Explore Courses</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('coding_lab')}
            className="flex-1 min-w-[140px] sm:flex-none px-5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] font-medium text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <Code className="w-4 h-4 text-[var(--muted-text)]" />
            <span>Virtual Lab</span>
          </button>

          {!currentUser ? (
            <button
              onClick={() => openAuthModal('student_login')}
              className="flex-1 min-w-[140px] sm:flex-none px-5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] font-medium text-sm transition cursor-pointer shadow-xs"
            >
              Student Sign In
            </button>
          ) : (
            <button
              onClick={() => onNavigate(currentUser.role === 'admin' ? 'admin_dashboard' : 'student_dashboard')}
              className="flex-1 min-w-[140px] sm:flex-none px-5 py-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:opacity-80 font-medium text-sm transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>{currentUser.role === 'admin' ? 'Owner Portal' : 'My Learning'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Technical Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-14 text-left">
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <Cpu className="w-5 h-5 text-[var(--muted-text)] mb-2" />
            <div className="text-sm font-semibold text-[var(--foreground)]">Circuit Fundamentals</div>
            <div className="text-xs text-[var(--muted-text)] mt-1">From Ohm's law to BJT amplifiers and filtering</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <Terminal className="w-5 h-5 text-[var(--muted-text)] mb-2" />
            <div className="text-sm font-semibold text-[var(--foreground)]">Microcontroller Lab</div>
            <div className="text-xs text-[var(--muted-text)] mt-1">Arduino Uno, ESP32 Wi-Fi, and RP2040 Pico</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <ShieldCheck className="w-5 h-5 text-[var(--muted-text)] mb-2" />
            <div className="text-sm font-semibold text-[var(--foreground)]">Mentor Reviewed</div>
            <div className="text-xs text-[var(--muted-text)] mt-1">Faculty assessment, grading, and schematic reviews</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <ShoppingBag className="w-5 h-5 text-[var(--muted-text)] mb-2" />
            <div className="text-sm font-semibold text-[var(--foreground)]">STEM Store</div>
            <div className="text-xs text-[var(--muted-text)] mt-1">Direct hardware kits matching each lab course</div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED COURSES SECTION */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[var(--border)]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)] mb-1">
              Curriculum Catalog
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
              Featured Electronics Courses
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-1">
              Hands-on courses with step-by-step video lectures, schematic analysis, and lab challenges.
            </p>
          </div>
          <button
            onClick={() => onNavigate('courses')}
            className="mt-3 sm:mt-0 text-xs sm:text-sm font-semibold text-[var(--foreground)] hover:underline flex items-center gap-1 transition cursor-pointer"
          >
            <span>All Courses ({courses.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
              <div
                key={course.id}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col shadow-xs hover:border-[var(--muted-text)] transition-all duration-200"
              >
                {/* Real Course Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-[var(--surface-secondary)]">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] shadow-xs">
                    {course.category}
                  </span>
                  {enrolled ? (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      ✓ Enrolled
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--foreground)] text-[var(--background)]">
                      ${course.price}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--foreground)] line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[var(--muted-text)] mt-1.5 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-text)]">
                      <span>{course.duration}</span>
                      <span className="text-[var(--foreground)] font-medium">{course.level}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => onNavigate('course_details', course.id)}
                      className="w-full py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-xs font-medium text-[var(--background)] transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{enrolled ? 'Continue Course' : 'View Syllabus & Enroll'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. VIRTUAL LAB & HARDWARE ENVIRONMENT PREVIEW */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="p-6 sm:p-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] mb-3">
                <Code className="w-3 h-3 text-[var(--muted-text)]" />
                <span>Integrated Engineering Environment</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight mb-3">
                Virtual Hardware & Real-Time Code Simulation
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted-text)] leading-relaxed mb-5">
                Experiment before touching physical hardware. Write Arduino C/C++ or MicroPython, build with visual blocks, monitor GPIO pin states, and simulate HC-SR04 ultrasonic sensors, OLEDs, and servos in real time.
              </p>

              <div className="space-y-2.5 text-xs text-[var(--foreground)] mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>ESP32 NodeMCU, Arduino Uno R3, and Raspberry Pi Pico RP2040</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dual Code & Block programming with instant board code generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Live Serial Monitor (115200 / 9600 baud) and interactive I/O controls</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('coding_lab')}
                className="px-4 py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-medium text-xs sm:text-sm transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Launch Coding Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clean Technical Preview Panel */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 font-mono text-xs text-[var(--foreground)]">
              <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-3 text-[11px]">
                <span className="font-semibold text-[var(--foreground)]">ESP32 Pinout & Firmware Simulator</span>
                <span className="text-emerald-500 font-medium">STATUS: READY</span>
              </div>
              <div className="bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] space-y-1.5">
                <div className="text-[var(--muted-text)] text-[10px]">// Pin configuration & setup</div>
                <div><span className="text-emerald-500 font-semibold">void</span> <span className="text-[var(--foreground)] font-semibold">setup</span>() &#123;</div>
                <div className="pl-4 text-[var(--muted-text)]">Serial.<span className="text-emerald-500">begin</span>(115200);</div>
                <div className="pl-4 text-[var(--muted-text)]">pinMode(2, OUTPUT); <span className="opacity-50">// Built-in LED</span></div>
                <div>&#125;</div>
                <div><span className="text-emerald-500 font-semibold">void</span> <span className="text-[var(--foreground)] font-semibold">loop</span>() &#123;</div>
                <div className="pl-4 text-[var(--muted-text)]">digitalWrite(2, HIGH);</div>
                <div className="pl-4 text-[var(--muted-text)]">delay(1000);</div>
                <div>&#125;</div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--muted-text)]">
                <span>Board: ESP32-WROOM-32</span>
                <span className="text-[var(--foreground)] font-semibold">I/O: GPIO 2 = HIGH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOUR-STEP LEARNING CYCLE */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)] mb-1">
            Structured Progression
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
            How Learning Works
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-1">
            Step-by-step curriculum designed for verifiable engineering competence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <div className="text-xs font-mono font-semibold text-[var(--muted-text)] mb-2">STEP 01</div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Video Demonstrations</h3>
            <p className="text-xs text-[var(--muted-text)] leading-relaxed">
              Step-by-step laboratory explanations, circuit schematics, and live breadboard wiring.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <div className="text-xs font-mono font-semibold text-[var(--muted-text)] mb-2">STEP 02</div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Virtual Lab Practice</h3>
            <p className="text-xs text-[var(--muted-text)] leading-relaxed">
              Build and debug firmware directly on simulated microcontrollers before physical assembly.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <div className="text-xs font-mono font-semibold text-[var(--muted-text)] mb-2">STEP 03</div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Assessments & Labs</h3>
            <p className="text-xs text-[var(--muted-text)] leading-relaxed">
              Pass timed module assessments and submit hands-on lab code for mentor review.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <div className="text-xs font-mono font-semibold text-[var(--muted-text)] mb-2">STEP 04</div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Verified Certificate</h3>
            <p className="text-xs text-[var(--muted-text)] leading-relaxed">
              Earn an official certificate upon completing all lessons and passing course tests.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-16">
        <div className="p-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center shadow-xs">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2">
            Ready to Begin Your Electronics Journey?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted-text)] max-w-lg mx-auto mb-6">
            Sign up for courses, test your skills in the virtual hardware lab, and earn verified certifications.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => openAuthModal('register')}
              className="px-5 py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-medium text-xs sm:text-sm transition cursor-pointer shadow-xs"
            >
              Create Student Account
            </button>
            <button
              onClick={() => onNavigate('courses')}
              className="px-5 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] font-medium text-xs sm:text-sm transition cursor-pointer shadow-xs"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
