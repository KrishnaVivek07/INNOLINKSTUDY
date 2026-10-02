import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LMSProvider, useLMS } from './context/LMSContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/auth/AuthModal';
import { CertificateModal } from './components/CertificateModal';
import { IntroSplash } from './components/IntroSplash';
import { Lock, ShieldAlert, ArrowRight, GraduationCap, Shield } from 'lucide-react';

import { LandingPage } from './pages/LandingPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { LessonPage } from './pages/LessonPage';
import { TestPage } from './pages/TestPage';
import { MentorDashboard } from './pages/MentorDashboard';
import { MentorUploadPage } from './pages/MentorUploadPage';
import { MentorTestBuilderPage } from './pages/MentorTestBuilderPage';
import { MentorAssignmentsPage } from './pages/MentorAssignmentsPage';

// Access Gate when unauthenticated user attempts to view a protected portal
const AccessRequiredGate: React.FC<{
  type: 'student' | 'mentor';
  onSignIn: () => void;
  onHome: () => void;
}> = ({ type, onSignIn, onHome }) => {
  const isMentor = type === 'mentor';
  return (
    <div className="py-20 sm:py-28 px-4 max-w-md mx-auto text-center space-y-4">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border shadow-lg ${
          isMentor
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
        }`}
      >
        {isMentor ? <Shield className="w-7 h-7" /> : <GraduationCap className="w-7 h-7" />}
      </div>

      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {isMentor ? 'Faculty Mentor Authentication Required' : 'Student Sign In Required'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
          {isMentor
            ? 'Access to the Mentor Dashboard, Course Builder, and Student Authorization portal is restricted strictly to the authorized Faculty Mentor.'
            : 'Access to your Learning Path, laboratory assignments, and module tests is restricted strictly to authorized enrolled students.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <button
          onClick={onSignIn}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-lg transition cursor-pointer flex items-center justify-center gap-2 ${
            isMentor
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
              : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
          }`}
        >
          <span>{isMentor ? 'Faculty Mentor Sign In' : 'Student Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onHome}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs sm:text-sm text-slate-300 transition cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

function AppContent() {
  const { currentUser, role } = useAuth();
  const { courses } = useLMS();

  const isAuthenticated = !!currentUser;
  const isMentor = isAuthenticated && role === 'mentor';
  const isStudent = isAuthenticated && role === 'student';

  // Intro Splash screen: display at first launch
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    const seen = sessionStorage.getItem('innolink_intro_viewed');
    return !seen;
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('home');

  // Selected entities for deep-linked views
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || 'course-elec-101');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('les-1');
  const [selectedTestId, setSelectedTestId] = useState<string>('test-mod-1');

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'student_login' | 'mentor_login' | 'register'>('student_login');

  // Certificate modal
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certCourseId, setCertCourseId] = useState<string>('');
  const [certId, setCertId] = useState<string>('CERT-INNO-2026-9912');

  const openAuthModal = (mode: 'student_login' | 'mentor_login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleNavigateToCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveTab('course_details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToLesson = (courseId: string, lessonId: string) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId(lessonId);
    setActiveTab('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToTest = (courseId: string, testId: string) => {
    if (!isAuthenticated) {
      openAuthModal('student_login');
      return;
    }
    setSelectedCourseId(courseId);
    setSelectedTestId(testId);
    setActiveTab('student_tests');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewCertificate = (courseId: string, certificateId?: string) => {
    setCertCourseId(courseId);
    if (certificateId) setCertId(certificateId);
    setCertModalOpen(true);
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem('innolink_intro_viewed', 'true');
    setShowIntro(false);
  };

  const currentCertCourse = courses.find((c) => c.id === certCourseId) || courses[0];

  return (
    <>
      {/* 1. INTRO SPLASH VIDEO / ANIMATION */}
      {showIntro && <IntroSplash onComplete={handleIntroComplete} />}

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
        {/* Primary Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openAuthModal={openAuthModal}
          onReplayIntro={() => setShowIntro(true)}
        />

        {/* Main Content Area with Strict Authentication Route Protection */}
        <main className="flex-1 pb-16 md:pb-0">
          {activeTab === 'home' && (
            <LandingPage
              onNavigate={(tab, param) => {
                if (param && tab === 'course_details') {
                  handleNavigateToCourse(param);
                } else {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              openAuthModal={openAuthModal}
            />
          )}

          {activeTab === 'courses' && (
            <CoursesPage
              onSelectCourse={handleNavigateToCourse}
              openAuthModal={openAuthModal}
            />
          )}

          {activeTab === 'course_details' && (
            <CourseDetailsPage
              courseId={selectedCourseId}
              onNavigateToLesson={handleNavigateToLesson}
              onBack={() => setActiveTab('courses')}
              openAuthModal={openAuthModal}
            />
          )}

          {/* Student Dashboard - STRICT PROTECTION: Never appears before login */}
          {activeTab === 'student_dashboard' && (
            isAuthenticated ? (
              <StudentDashboard
                onNavigateToCourse={handleNavigateToCourse}
                onNavigateToLesson={handleNavigateToLesson}
                onNavigateToTest={handleNavigateToTest}
                onViewCertificate={handleViewCertificate}
              />
            ) : (
              <AccessRequiredGate
                type="student"
                onSignIn={() => openAuthModal('student_login')}
                onHome={() => setActiveTab('home')}
              />
            )
          )}

          {activeTab === 'lesson' && (
            <LessonPage
              courseId={selectedCourseId}
              lessonId={selectedLessonId}
              onNavigateToLesson={handleNavigateToLesson}
              onNavigateToTest={handleNavigateToTest}
              onBack={() => handleNavigateToCourse(selectedCourseId)}
            />
          )}

          {/* Student Tests - STRICT PROTECTION */}
          {activeTab === 'student_tests' && (
            isAuthenticated ? (
              <TestPage
                courseId={selectedCourseId}
                testId={selectedTestId}
                onNavigateToCourse={handleNavigateToCourse}
                onNavigateToLesson={handleNavigateToLesson}
                onBack={() => setActiveTab('student_dashboard')}
              />
            ) : (
              <AccessRequiredGate
                type="student"
                onSignIn={() => openAuthModal('student_login')}
                onHome={() => setActiveTab('home')}
              />
            )
          )}

          {/* Mentor Dashboard - STRICT PROTECTION: Only Single Authorized Faculty Mentor */}
          {activeTab === 'mentor_dashboard' && (
            isMentor ? (
              <MentorDashboard
                onNavigateToUpload={(cId) => {
                  if (cId) setSelectedCourseId(cId);
                  setActiveTab('mentor_upload');
                }}
                onNavigateToTestBuilder={(cId) => {
                  if (cId) setSelectedCourseId(cId);
                  setActiveTab('mentor_tests');
                }}
                onNavigateToAssignments={() => setActiveTab('mentor_assignments')}
                onSelectCourse={handleNavigateToCourse}
                onOpenChangePassword={() => openAuthModal('mentor_login')}
              />
            ) : (
              <AccessRequiredGate
                type="mentor"
                onSignIn={() => openAuthModal('mentor_login')}
                onHome={() => setActiveTab('home')}
              />
            )
          )}

          {activeTab === 'mentor_upload' && (
            isMentor ? (
              <MentorUploadPage
                initialCourseId={selectedCourseId}
                onSuccess={(cId, lId) => {
                  handleNavigateToLesson(cId, lId);
                }}
                onBack={() => setActiveTab('mentor_dashboard')}
              />
            ) : (
              <AccessRequiredGate
                type="mentor"
                onSignIn={() => openAuthModal('mentor_login')}
                onHome={() => setActiveTab('home')}
              />
            )
          )}

          {activeTab === 'mentor_tests' && (
            isMentor ? (
              <MentorTestBuilderPage
                initialCourseId={selectedCourseId}
                onSuccess={(tId) => {
                  setSelectedTestId(tId);
                  setActiveTab('student_tests');
                }}
                onBack={() => setActiveTab('mentor_dashboard')}
              />
            ) : (
              <AccessRequiredGate
                type="mentor"
                onSignIn={() => openAuthModal('mentor_login')}
                onHome={() => setActiveTab('home')}
              />
            )
          )}

          {activeTab === 'mentor_assignments' && (
            isMentor ? (
              <MentorAssignmentsPage onBack={() => setActiveTab('mentor_dashboard')} />
            ) : (
              <AccessRequiredGate
                type="mentor"
                onSignIn={() => openAuthModal('mentor_login')}
                onHome={() => setActiveTab('home')}
              />
            )
          )}
        </main>

        {/* Primary Footer */}
        <Footer />

        {/* Mobile Bottom Navigation Bar */}
        <MobileNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openAuthModal={openAuthModal}
        />

        {/* Offline Status Toast */}
        <OfflineIndicator />

        {/* Auth Modal with Strict 4-Digit OTP and PWA download */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />

        {/* Verified Certificate Modal */}
        <CertificateModal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          studentName={currentUser?.displayName || 'Alex Mercer'}
          courseTitle={currentCertCourse?.title || 'Electronics Fundamentals & Circuit Analysis'}
          certificateId={certId}
          completedDate={new Date().toISOString()}
        />
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LMSProvider>
          <AppContent />
        </LMSProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
