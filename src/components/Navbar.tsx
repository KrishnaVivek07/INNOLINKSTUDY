import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { useBranding } from '../context/BrandingContext';
import { useTheme } from '../context/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeSelector } from './ThemeSelector';
import { TermsModal } from './terms/TermsModal';
import { getTermsAndConditions } from '../services/termsService';
import { TermsAndConditions } from '../types';
import {
  Cpu,
  LogOut,
  User,
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
  ShoppingCart,
  ShoppingBag,
  Code,
  Shield,
  FileCheck,
  FileText,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: (mode: 'student_login' | 'admin_login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
}) => {
  const { currentUser, isAdmin, logout } = useAuth();
  const { cartCount } = useMarketplace();
  const { branding } = useBranding();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsData, setTermsData] = useState<TermsAndConditions | null>(null);

  const handleOpenTerms = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    const t = await getTermsAndConditions();
    setTermsData(t);
    setTermsModalOpen(true);
  };

  const isAuthenticated = !!currentUser;

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    setUserDropdownOpen(false);
    setActiveTab('home');
  };

  const getNavBtnClasses = (tabName: string) => {
    const isActive = activeTab === tabName;
    return `px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
      isActive
        ? 'bg-[var(--surface-secondary)] text-[var(--foreground)] font-semibold shadow-xs border border-[var(--border)]'
        : 'text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
    }`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--header-border)] bg-[var(--header-background)] text-[var(--header-text)] backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo with proper aspect-ratio and object-contain */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.platformName}
                className="h-8 max-h-8 w-auto max-w-[130px] object-contain rounded-md"
              />
            ) : (
              <div
                className="h-8 w-8 rounded-lg p-0.5 shadow-xs flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: branding.primaryAccent || '#10B981' }}
              >
                <Cpu className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex items-center tracking-tight font-bold text-sm sm:text-base">
              <span className="text-[var(--header-text)]">{branding.shortName || branding.platformName}</span>
              {branding.shortName && branding.shortName !== branding.platformName && (
                <span className="text-[var(--muted-text)] ml-1 font-normal hidden sm:inline text-xs">
                  {branding.platformName.replace(branding.shortName, '').trim()}
                </span>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* PUBLIC NAVIGATION */}
            {!isAuthenticated && (
              <>
                <button onClick={() => handleNavClick('home')} className={getNavBtnClasses('home')}>
                  Home
                </button>
                <button onClick={() => handleNavClick('courses')} className={getNavBtnClasses('courses')}>
                  Courses
                </button>
                <button onClick={() => handleNavClick('coding_lab')} className={getNavBtnClasses('coding_lab')}>
                  <Code className="w-3.5 h-3.5" />
                  <span>Coding Lab</span>
                </button>
                <button onClick={() => handleNavClick('marketplace')} className={getNavBtnClasses('marketplace')}>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>STEM Store</span>
                </button>
              </>
            )}

            {/* STUDENT NAVIGATION */}
            {isAuthenticated && !isAdmin && (
              <>
                <button onClick={() => handleNavClick('home')} className={getNavBtnClasses('home')}>
                  Home
                </button>
                <button onClick={() => handleNavClick('courses')} className={getNavBtnClasses('courses')}>
                  Courses
                </button>
                <button onClick={() => handleNavClick('student_dashboard')} className={getNavBtnClasses('student_dashboard')}>
                  My Learning
                </button>
                <button onClick={() => handleNavClick('coding_lab')} className={getNavBtnClasses('coding_lab')}>
                  <Code className="w-3.5 h-3.5" />
                  <span>Coding Lab</span>
                </button>
                <button onClick={() => handleNavClick('student_tests')} className={getNavBtnClasses('student_tests')}>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Tests</span>
                </button>
                <button onClick={() => handleNavClick('marketplace')} className={getNavBtnClasses('marketplace')}>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>STEM Store</span>
                </button>
              </>
            )}

            {/* ADMIN NAVIGATION */}
            {isAdmin && (
              <>
                <button
                  onClick={() => handleNavClick('admin_dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'admin_dashboard'
                      ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                      : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Owner Portal</span>
                </button>
                <button onClick={() => handleNavClick('courses')} className={getNavBtnClasses('courses')}>
                  Courses
                </button>
                <button onClick={() => handleNavClick('coding_lab')} className={getNavBtnClasses('coding_lab')}>
                  <Code className="w-3.5 h-3.5" />
                  <span>Coding Lab</span>
                </button>
                <button onClick={() => handleNavClick('marketplace')} className={getNavBtnClasses('marketplace')}>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>STEM Store</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2">
            {/* Marketplace Cart Button */}
            <button
              onClick={() => handleNavClick('marketplace')}
              className="relative p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] transition cursor-pointer shadow-xs"
              title="View STEM Hardware Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-white font-bold text-[9px] shadow-xs"
                  style={{ backgroundColor: branding.primaryAccent || '#10B981' }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Theme Selector (Light, Dark, System) */}
            <ThemeSelector />

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* User Profile or Two Login Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition cursor-pointer shadow-xs"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                    style={{ backgroundColor: isAdmin ? '#0F172A' : branding.primaryAccent || '#10B981' }}
                  >
                    {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline font-medium max-w-[110px] truncate text-[11px]">
                    {currentUser?.displayName}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl z-50 text-[var(--foreground)]">
                    <div className="px-2.5 py-1.5 border-b border-[var(--border)]">
                      <p className="text-xs font-semibold text-[var(--foreground)] truncate">{currentUser?.displayName}</p>
                      <p className="text-[10px] text-[var(--muted-text)] truncate">{currentUser?.email}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)]">
                          {isAdmin ? 'Platform Administrator' : 'Enrolled Student'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleNavClick(isAdmin ? 'admin_dashboard' : 'student_dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-lg transition"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[var(--muted-text)]" />
                        <span>{isAdmin ? 'Owner Portal' : 'Student Dashboard'}</span>
                      </button>
                    </div>

                    {/* Profile -> Theme Switcher (Light / Dark / System) */}
                    <div className="py-2 px-2.5 border-t border-[var(--border)]">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-text)] block mb-1.5">
                        Interface Theme
                      </span>
                      <div className="grid grid-cols-3 gap-1 bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                            theme === 'light'
                              ? 'bg-[var(--surface)] text-[var(--foreground)] font-bold shadow-xs border border-[var(--border)]'
                              : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                          }`}
                          title="Light Mode"
                        >
                          <Sun className="w-3 h-3" />
                          <span>Light</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-[var(--surface)] text-[var(--foreground)] font-bold shadow-xs border border-[var(--border)]'
                              : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                          }`}
                          title="Dark Mode"
                        >
                          <Moon className="w-3 h-3" />
                          <span>Dark</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('system')}
                          className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                            theme === 'system'
                              ? 'bg-[var(--surface)] text-[var(--foreground)] font-bold shadow-xs border border-[var(--border)]'
                              : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                          }`}
                          title="System Mode (auto follows OS)"
                        >
                          <Laptop className="w-3 h-3" />
                          <span>Auto</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-[var(--border)]">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ONLY TWO LOGIN BUTTONS (Theme Responsive) */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openAuthModal('student_login')}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--foreground)] transition cursor-pointer shadow-xs"
                >
                  Student Login
                </button>
                <button
                  onClick={() => openAuthModal('admin_login')}
                  className="px-3 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-xs font-semibold text-[var(--background)] transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Owner Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
