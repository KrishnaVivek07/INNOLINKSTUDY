import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeSelector } from './ThemeSelector';
import {
  Cpu,
  LogOut,
  User,
  BookOpen,
  LayoutDashboard,
  Upload,
  ClipboardCheck,
  Menu,
  X,
  Play,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: (mode: 'student_login' | 'mentor_login' | 'register') => void;
  onReplayIntro?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  onReplayIntro,
}) => {
  const { currentUser, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isAuthenticated = !!currentUser;
  const isMentor = isAuthenticated && role === 'mentor';
  const isStudent = isAuthenticated && role === 'student';

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    setUserDropdownOpen(false);
    setActiveTab('home');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-600 p-0.5 shadow-md shadow-cyan-500/10 group-hover:scale-105 transition-transform">
              <div className="h-full w-full rounded-[6px] bg-slate-950 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center tracking-tight font-bold text-sm sm:text-base">
              <span className="text-white">InnoLink</span>
              <span className="text-cyan-400 ml-1">Tech</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* PUBLIC NAVIGATION (When NOT logged in) */}
            {!isAuthenticated && (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'home'
                      ? 'text-cyan-400 bg-cyan-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavClick('courses')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'courses'
                      ? 'text-cyan-400 bg-cyan-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Courses
                </button>
              </>
            )}

            {/* STUDENT NAVIGATION (Only when student is authenticated) */}
            {isStudent && (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'home'
                      ? 'text-cyan-400 bg-cyan-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavClick('courses')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'courses'
                      ? 'text-cyan-400 bg-cyan-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Courses
                </button>
                <button
                  onClick={() => handleNavClick('student_dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'student_dashboard'
                      ? 'text-cyan-400 bg-cyan-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  My Learning
                </button>
                <button
                  onClick={() => handleNavClick('student_tests')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'student_tests'
                      ? 'text-cyan-400 bg-cyan-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Tests
                </button>
              </>
            )}

            {/* MENTOR NAVIGATION (Only when faculty mentor is authenticated) */}
            {isMentor && (
              <>
                <button
                  onClick={() => handleNavClick('mentor_dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'mentor_dashboard'
                      ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavClick('courses')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'courses'
                      ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Courses
                </button>
                <button
                  onClick={() => handleNavClick('mentor_upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'mentor_upload'
                      ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <button
                  onClick={() => handleNavClick('mentor_tests')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'mentor_tests'
                      ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Tests
                </button>
                <button
                  onClick={() => handleNavClick('mentor_assignments')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'mentor_assignments'
                      ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Submissions
                </button>
              </>
            )}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2">
            {/* Replay Intro Video Button */}
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                title="Play Intro Video"
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/70 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
              >
                <Play className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px]">Intro</span>
              </button>
            )}

            {/* Theme Customizer Switcher: Light / Dark / System */}
            <ThemeSelector />

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* User Profile or Login Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-xs text-slate-200 hover:border-slate-700 transition cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                      isMentor ? 'bg-emerald-600' : 'bg-cyan-600'
                    }`}
                  >
                    {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline font-medium max-w-[90px] truncate text-[11px]">
                    {currentUser?.displayName}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 text-slate-200">
                    <div className="px-2.5 py-1.5 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">{currentUser?.displayName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            isMentor ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                          }`}
                        >
                          {isMentor ? 'Lead Faculty Mentor' : 'Student Scholar'}
                        </span>
                        {currentUser?.isVerified && (
                          <span className="text-[9px] text-emerald-400">✓ Authorized</span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleNavClick(isMentor ? 'mentor_dashboard' : 'student_dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dashboard</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openAuthModal('student_login')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  Student Sign In
                </button>
                <button
                  onClick={() => openAuthModal('mentor_login')}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Faculty Mentor
                </button>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
              activeTab === 'home' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('courses')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
              activeTab === 'courses' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
            }`}
          >
            Courses Catalog
          </button>

          {isStudent && (
            <>
              <button
                onClick={() => handleNavClick('student_dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                  activeTab === 'student_dashboard' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
                }`}
              >
                My Learning
              </button>
              <button
                onClick={() => handleNavClick('student_tests')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                  activeTab === 'student_tests' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
                }`}
              >
                Tests & Quizzes
              </button>
            </>
          )}

          {isMentor && (
            <>
              <button
                onClick={() => handleNavClick('mentor_dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                  activeTab === 'mentor_dashboard' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300'
                }`}
              >
                Mentor Dashboard
              </button>
              <button
                onClick={() => handleNavClick('mentor_upload')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                  activeTab === 'mentor_upload' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300'
                }`}
              >
                Course Builder / Upload
              </button>
              <button
                onClick={() => handleNavClick('mentor_tests')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                  activeTab === 'mentor_tests' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300'
                }`}
              >
                Create Test
              </button>
            </>
          )}

          {!isAuthenticated && (
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  openAuthModal('student_login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-lg bg-cyan-600 text-xs font-semibold text-white"
              >
                Student Sign In
              </button>
              <button
                onClick={() => {
                  openAuthModal('mentor_login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white"
              >
                Faculty Mentor Sign In
              </button>
            </div>
          )}

          {isAuthenticated && (
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleSignOut}
                className="w-full py-2 rounded-lg bg-rose-950/40 text-rose-300 text-xs font-semibold text-left px-3 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out ({currentUser?.displayName})</span>
              </button>
            </div>
          )}

          {onReplayIntro && (
            <button
              onClick={() => {
                onReplayIntro();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-cyan-400 hover:bg-slate-900 flex items-center gap-2 pt-2 border-t border-slate-800"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Watch Intro Video</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
