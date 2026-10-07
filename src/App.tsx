import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LMSProvider, useLMS } from './context/LMSContext';
import { ThemeProvider } from './context/ThemeContext';
import { BrandingProvider, useBranding } from './context/BrandingContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/auth/AuthModal';
import { CertificateModal } from './components/CertificateModal';
import { Shield, GraduationCap, ArrowRight } from 'lucide-react';

import { LandingPage } from './pages/LandingPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { LessonPage } from './pages/LessonPage';
import { TestPage } from './pages/TestPage';
import { AdminDashboard, AdminTab } from './pages/AdminDashboard';
import { CodingLabPage } from './pages/CodingLabPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MarketplaceProvider } from './context/MarketplaceContext';

// Access Gate when unauthorized user attempts to view a protected portal
const AccessRequiredGate: React.FC<{
  type: 'student' | 'admin';
  onSignIn: () => void;
  onHome: () => void;
}> = ({ type, onSignIn, onHome }) => {
  const isAdmin = type === 'admin';
  const { branding } = useBranding();

  return (
    <div className="py-20 sm:py-28 px-4 max-w-md mx-auto text-center space-y-5">
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto border shadow-xs ${
          isAdmin
            ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--border)]'
            : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--foreground)]'
        }`}
      >
        {isAdmin ? <Shield className="w-7 h-7" /> : <GraduationCap className="w-7 h-7" />}
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
          {isAdmin ? 'Owner Authentication Required' : 'Student Sign In Required'}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--muted-text)] leading-relaxed max-w-sm mx-auto">
          {isAdmin
            ? `Access to the ${branding.platformName} Owner Portal, Course Management, and Hardware Catalog is strictly restricted to verified platform owners.`
            : 'Access to your Learning Path, laboratory assignments, and module tests is restricted to enrolled students.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <button
          onClick={onSignIn}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm text-[var(--background)] bg-[var(--foreground)] hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          <span>{isAdmin ? 'Owner Sign In' : 'Student Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onHome}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-xs sm:text-sm font-medium text-[var(--foreground)] transition cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

function AppContent() {
  const { currentUser, role, isAdmin, isStudent } = useAuth();
  const { courses } = useLMS();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('home');

  // Selected entities for deep-linked views
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || 'course-elec-101');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('les-1');
  const [selectedTestId, setSelectedTestId] = useState<string>('test-mod-1');
  const [selectedMarketplaceKitId, setSelectedMarketplaceKitId] = useState<string | undefined>(undefined);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'student_login' | 'admin_login' | 'register'>('student_login');

  // Certificate modal
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certCourseId, setCertCourseId] = useState<string>('');
  const [certId, setCertId] = useState<string>('CERT-INNO-2026-9912');

  const openAuthModal = (mode: 'student_login' | 'admin_login' | 'register') => {
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
    setSelectedCourseId(courseId);
    setSelectedTestId(testId);
    setActiveTab('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewCertificate = (courseId: string, certificateId?: string) => {
    setCertCourseId(courseId);
    setCertId(certificateId || 'CERT-INNO-2026-9912');
    setCertModalOpen(true);
  };

  const currentCertCourse = courses.find((c) => c.id === certCourseId) || courses[0];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuthModal={openAuthModal}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16 md:pb-0">
        {/* Landing Page */}
        {activeTab === 'home' && (
          <LandingPage
            onNavigate={(tab, param) => {
              if (tab === 'course_details' && param) {
                handleNavigateToCourse(param);
              } else if (tab === 'coding_lab' && param) {
                setSelectedCourseId(param);
                setActiveTab('coding_lab');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            openAuthModal={openAuthModal}
          />
        )}

        {/* Public Courses Catalog */}
        {activeTab === 'courses' && (
          <CoursesPage
            onSelectCourse={handleNavigateToCourse}
            openAuthModal={openAuthModal}
          />
        )}

        {/* Course Details & Syllabus */}
        {activeTab === 'course_details' && (
          <CourseDetailsPage
            courseId={selectedCourseId}
            onNavigateToLesson={handleNavigateToLesson}
            onBack={() => setActiveTab('courses')}
            openAuthModal={openAuthModal}
          />
        )}

        {/* Lesson Video Player & Coursework */}
        {activeTab === 'lesson' && (
          <LessonPage
            courseId={selectedCourseId}
            lessonId={selectedLessonId}
            onBack={() => setActiveTab('course_details')}
            onNavigateToLesson={(cId, nextLesId) => handleNavigateToLesson(cId, nextLesId)}
            onNavigateToTest={(cId, testId) => handleNavigateToTest(cId, testId)}
          />
        )}

        {/* Formal Course Test Exam */}
        {activeTab === 'test' && (
          <TestPage
            courseId={selectedCourseId}
            testId={selectedTestId}
            onBack={() => setActiveTab('course_details')}
            onNavigateToCourse={handleNavigateToCourse}
            onNavigateToLesson={handleNavigateToLesson}
          />
        )}

        {/* Student Learning Portal */}
        {activeTab === 'student_dashboard' && (
          currentUser ? (
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

        {/* Unified Admin Command Center */}
        {activeTab === 'admin_dashboard' && (
          isAdmin ? (
            <AdminDashboard
              initialTab="dashboard"
              onNavigateToCourse={handleNavigateToCourse}
              onNavigateToLesson={handleNavigateToLesson}
            />
          ) : (
            <AccessRequiredGate
              type="admin"
              onSignIn={() => openAuthModal('admin_login')}
              onHome={() => setActiveTab('home')}
            />
          )
        )}

        {/* Coding & Hardware Simulation Lab */}
        {activeTab === 'coding_lab' && (
          <CodingLabPage
            initialCourseId={selectedCourseId}
            onNavigateToCourse={handleNavigateToCourse}
            onNavigateToMarketplaceKit={(kitId) => {
              setSelectedMarketplaceKitId(kitId);
              setActiveTab('marketplace');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* STEM Hardware Marketplace */}
        {activeTab === 'marketplace' && (
          <MarketplacePage
            onNavigateToCourse={handleNavigateToCourse}
            openAuthModal={openAuthModal}
            targetProductId={selectedMarketplaceKitId}
          />
        )}
      </main>

      {/* Primary Responsive Footer */}
      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuthModal={openAuthModal}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Auth Modal with ONLY TWO PORTALS: Student & Admin */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Verified Certificate Modal */}
      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        studentName={currentUser?.displayName || 'Student'}
        courseTitle={currentCertCourse?.title || 'Electronics Fundamentals & Circuit Analysis'}
        certificateId={certId}
        completedDate={new Date().toISOString()}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrandingProvider>
        <AuthProvider>
          <LMSProvider>
            <MarketplaceProvider>
              <AppContent />
            </MarketplaceProvider>
          </LMSProvider>
        </AuthProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
