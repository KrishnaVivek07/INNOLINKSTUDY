import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  BookOpen,
  GraduationCap,
  ClipboardList,
  User,
  LayoutDashboard,
  Upload,
  Users,
  CheckCircle2,
  LogIn,
  Shield,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: (mode: 'student_login' | 'mentor_login' | 'register') => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, openAuthModal }) => {
  const { currentUser, role } = useAuth();

  const isAuthenticated = !!currentUser;
  const isMentor = isAuthenticated && role === 'mentor';
  const isStudent = isAuthenticated && role === 'student';

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around">
        {/* Unauthenticated Navigation */}
        {!isAuthenticated && (
          <>
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition cursor-pointer ${
                activeTab === 'home' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition cursor-pointer ${
                activeTab === 'courses' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Courses</span>
            </button>

            <button
              onClick={() => openAuthModal('student_login')}
              className="flex flex-col items-center py-1 px-3 rounded-xl text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
            >
              <LogIn className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Sign In</span>
            </button>

            <button
              onClick={() => openAuthModal('mentor_login')}
              className="flex flex-col items-center py-1 px-3 rounded-xl text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Faculty</span>
            </button>
          </>
        )}

        {/* Authenticated Student Mobile Navigation */}
        {isStudent && (
          <>
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
                activeTab === 'home' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
                activeTab === 'courses' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Courses</span>
            </button>

            <button
              onClick={() => setActiveTab('student_dashboard')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
                activeTab === 'student_dashboard' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">My Learning</span>
            </button>

            <button
              onClick={() => setActiveTab('student_tests')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
                activeTab === 'student_tests' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Tests</span>
            </button>
          </>
        )}

        {/* Authenticated Mentor Mobile Navigation */}
        {isMentor && (
          <>
            <button
              onClick={() => setActiveTab('mentor_dashboard')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
                activeTab === 'mentor_dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
                activeTab === 'courses' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Courses</span>
            </button>

            <button
              onClick={() => setActiveTab('mentor_upload')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
                activeTab === 'mentor_upload' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('mentor_tests')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
                activeTab === 'mentor_tests' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Tests</span>
            </button>

            <button
              onClick={() => setActiveTab('mentor_assignments')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
                activeTab === 'mentor_assignments' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Submissions</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
