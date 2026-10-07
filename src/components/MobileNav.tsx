import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  BookOpen,
  GraduationCap,
  LogIn,
  Shield,
  Code,
  ShoppingBag,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: (mode: 'student_login' | 'admin_login' | 'register') => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, openAuthModal }) => {
  const { currentUser, isAdmin } = useAuth();
  const isAuthenticated = !!currentUser;

  const getBtnClass = (tab: string) =>
    `flex flex-col items-center py-1 px-2 rounded-xl transition cursor-pointer ${
      activeTab === tab
        ? 'text-[var(--foreground)] font-semibold'
        : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--header-background)] border-t border-[var(--header-border)] text-[var(--header-text)] backdrop-blur-lg px-2 py-1.5 safe-area-bottom transition-colors duration-200">
      <div className="flex items-center justify-around">
        {/* Unauthenticated Navigation */}
        {!isAuthenticated && (
          <>
            <button onClick={() => setActiveTab('home')} className={getBtnClass('home')}>
              <Home className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Home</span>
            </button>

            <button onClick={() => setActiveTab('courses')} className={getBtnClass('courses')}>
              <BookOpen className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Courses</span>
            </button>

            <button onClick={() => setActiveTab('coding_lab')} className={getBtnClass('coding_lab')}>
              <Code className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Lab</span>
            </button>

            <button onClick={() => setActiveTab('marketplace')} className={getBtnClass('marketplace')}>
              <ShoppingBag className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Store</span>
            </button>

            <button
              onClick={() => openAuthModal('student_login')}
              className="flex flex-col items-center py-1 px-2 rounded-xl text-[var(--foreground)] hover:opacity-80 transition cursor-pointer font-semibold"
            >
              <LogIn className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Sign In</span>
            </button>
          </>
        )}

        {/* Authenticated Student Mobile Navigation */}
        {isAuthenticated && !isAdmin && (
          <>
            <button onClick={() => setActiveTab('home')} className={getBtnClass('home')}>
              <Home className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Home</span>
            </button>

            <button onClick={() => setActiveTab('courses')} className={getBtnClass('courses')}>
              <BookOpen className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Courses</span>
            </button>

            <button onClick={() => setActiveTab('coding_lab')} className={getBtnClass('coding_lab')}>
              <Code className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Lab</span>
            </button>

            <button onClick={() => setActiveTab('student_dashboard')} className={getBtnClass('student_dashboard')}>
              <GraduationCap className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Learning</span>
            </button>

            <button onClick={() => setActiveTab('marketplace')} className={getBtnClass('marketplace')}>
              <ShoppingBag className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Store</span>
            </button>
          </>
        )}

        {/* Authenticated Admin Mobile Navigation */}
        {isAdmin && (
          <>
            <button onClick={() => setActiveTab('admin_dashboard')} className={getBtnClass('admin_dashboard')}>
              <Shield className="w-4 h-4" />
              <span className="text-[9px] font-bold mt-0.5">Admin</span>
            </button>

            <button onClick={() => setActiveTab('courses')} className={getBtnClass('courses')}>
              <BookOpen className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Courses</span>
            </button>

            <button onClick={() => setActiveTab('coding_lab')} className={getBtnClass('coding_lab')}>
              <Code className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Lab</span>
            </button>

            <button onClick={() => setActiveTab('marketplace')} className={getBtnClass('marketplace')}>
              <ShoppingBag className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Store</span>
            </button>

            <button onClick={() => setActiveTab('home')} className={getBtnClass('home')}>
              <Home className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Home</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
