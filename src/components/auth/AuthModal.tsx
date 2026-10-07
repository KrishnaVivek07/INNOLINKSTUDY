import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Download,
  Smartphone,
  ShieldAlert,
  Phone,
  Shield,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

export type AuthPortal = 'student' | 'admin';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'student_login' | 'admin_login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'student_login',
}) => {
  const {
    loginAdmin,
    registerStudentRequest,
    validateStudentStepOne,
    verifyStudentStepTwo,
    resetStudentPassword,
    resetAdminPassword,
  } = useAuth();
  const { branding } = useBranding();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Active portal: ONLY TWO PORTALS
  const [portal, setPortal] = useState<AuthPortal>(
    initialMode === 'admin_login' ? 'admin' : 'student'
  );

  // Submode within active portal
  const [studentMode, setStudentMode] = useState<'login' | 'register' | 'forgot_password' | 'otp_step'>(
    initialMode === 'register' ? 'register' : 'login'
  );
  const [adminMode, setAdminMode] = useState<'login' | 'change_password'>('login');

  // Common Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('course-elec-101');

  // Reset fields
  const [newPassword, setNewPassword] = useState('');

  // 4-Digit OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (initialMode === 'admin_login') {
      setPortal('admin');
      setAdminMode('login');
    } else if (initialMode === 'register') {
      setPortal('student');
      setStudentMode('register');
    } else {
      setPortal('student');
      setStudentMode('login');
    }
    setError(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  // Auto focus first OTP input when entering otp_step
  useEffect(() => {
    if (studentMode === 'otp_step' && otpInputsRef.current[0]) {
      otpInputsRef.current[0].focus();
    }
  }, [studentMode]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleSelectPortal = (newPortal: AuthPortal) => {
    setPortal(newPortal);
    resetMessages();
    setPassword('');
    if (newPortal === 'student') {
      setStudentMode('login');
    } else {
      setAdminMode('login');
    }
  };

  // 1. Student Login - Step 1: Validate Email & Password
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await validateStudentStepOne(email, password);
      setStudentMode('otp_step');
      setOtpDigits(['', '', '', '']);
      setSuccessMessage('Credentials verified. Enter your 4-digit security OTP to continue.');
    } catch (err: any) {
      setError(err.message || 'Invalid student credentials. Please check your email or password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Student Login - Step 2: Verify 4-Digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 4) {
      setError('Please enter the full 4-digit security OTP.');
      return;
    }

    setLoading(true);
    try {
      await verifyStudentStepTwo(email, fullOtp);
      setSuccessMessage('Student authenticated successfully. Welcome!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Student Registration Request
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await registerStudentRequest(name, email, phone, selectedCourse, undefined, password);
      setSuccessMessage(res.message);
      setTimeout(() => {
        setStudentMode('login');
        setPassword('');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Student registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Student Reset Password
  const handleStudentResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await resetStudentPassword(email, newPassword);
      setSuccessMessage('Password reset successfully. You can now log in with your new password.');
      setTimeout(() => {
        setStudentMode('login');
        setPassword('');
        setNewPassword('');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await loginAdmin(email, password);
      setSuccessMessage('Owner authenticated. Launching Owner Portal...');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Owner authentication failed. Access strictly restricted.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Admin Change Password
  const handleAdminChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    try {
      resetAdminPassword(newPassword);
      setSuccessMessage('Admin master password updated successfully.');
      setAdminMode('login');
      setPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update admin password.');
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-2xl p-6 sm:p-7 my-8 transition-colors duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.platformName}
                className="h-7 w-auto max-w-[120px] object-contain rounded"
              />
            ) : (
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: branding.primaryAccent || '#10B981' }}
              >
                <GraduationCap className="w-4 h-4" />
              </div>
            )}
            <span className="text-xs font-bold tracking-wider uppercase text-[var(--foreground)]">
              {branding.platformName}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {portal === 'student' ? 'Student Portal' : 'Owner Portal'}
          </h2>
          <p className="text-xs text-[var(--muted-text)] mt-1">
            {portal === 'student'
              ? 'Access your enrolled courses, practical hardware labs, tests, and STEM kits.'
              : 'Innolink Technologies — Authorized Owner Portal Access.'}
          </p>
        </div>

        {/* ==================================================== */}
        {/* ONLY TWO PORTAL SELECTION BUTTONS */}
        {/* ==================================================== */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] mb-5">
          <button
            type="button"
            onClick={() => handleSelectPortal('student')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              portal === 'student'
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs border border-[var(--border)]'
                : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Login</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectPortal('admin')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              portal === 'admin'
                ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Owner Login</span>
          </button>
        </div>

        {/* Error and Success Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* 1. STUDENT PORTAL FORMS */}
        {/* ==================================================== */}
        {portal === 'student' && (
          <>
            {/* Student Login Form */}
            {studentMode === 'login' && (
              <form onSubmit={handleStudentLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Student Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted-text)]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] pl-9 pr-3 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[var(--foreground)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('forgot_password');
                        resetMessages();
                      }}
                      className="text-[11px] text-[var(--muted-text)] hover:text-[var(--foreground)] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted-text)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] pl-9 pr-10 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-xs sm:text-sm font-semibold text-[var(--background)] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    {loading ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <span>Continue to Security Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--muted-text)] pt-2 border-t border-[var(--border)]">
                  <span>New student?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentMode('register');
                      resetMessages();
                    }}
                    className="font-semibold text-[var(--foreground)] hover:underline cursor-pointer"
                  >
                    Register Student Account
                  </button>
                </div>
              </form>
            )}

            {/* Student Step 2: 4-Digit OTP */}
            {studentMode === 'otp_step' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--muted-text)]">
                  Enter your 4-digit security authorization code.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-2 text-center">
                    4-Digit Security Code
                  </label>
                  <div className="flex justify-center gap-3">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputsRef.current[idx] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-12 h-12 text-center text-lg font-mono font-bold rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 4}
                  className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-xs sm:text-sm font-semibold text-[var(--background)] transition cursor-pointer shadow-xs"
                >
                  {loading ? <span>Verifying...</span> : <span>Confirm & Sign In</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('login');
                    resetMessages();
                  }}
                  className="w-full text-center text-xs text-[var(--muted-text)] hover:text-[var(--foreground)] py-1"
                >
                  ← Back to Email Sign In
                </button>
              </form>
            )}

            {/* Student Register Form */}
            {studentMode === 'register' && (
              <form onSubmit={handleStudentRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Primary Course of Interest</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                  >
                    <option value="course-elec-101">Electronics Fundamentals & Circuit Analysis</option>
                    <option value="course-esp32-201">ESP32 IoT & Embedded Systems Mastery</option>
                    <option value="course-arm-301">ARM Cortex-M Embedded Firmware & RTOS</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-xs sm:text-sm font-semibold text-[var(--background)] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
                >
                  {loading ? <span>Creating Account...</span> : <span>Complete Registration</span>}
                </button>

                <div className="text-center text-xs text-[var(--muted-text)] pt-1">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStudentMode('login');
                      resetMessages();
                    }}
                    className="text-[var(--foreground)] hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Student Forgot Password Form */}
            {studentMode === 'forgot_password' && (
              <form onSubmit={handleStudentResetPassword} className="space-y-3">
                <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--muted-text)]">
                  Enter your registered student email and a new password to reset your credentials.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Student Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 4 characters"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-xs sm:text-sm font-semibold text-[var(--background)] transition cursor-pointer"
                >
                  {loading ? <span>Updating Password...</span> : <span>Update Password</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('login');
                    resetMessages();
                  }}
                  className="w-full text-center text-xs text-[var(--muted-text)] hover:text-[var(--foreground)] py-1"
                >
                  ← Back to Student Sign In
                </button>
              </form>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* 2. ADMIN PORTAL FORMS */}
        {/* ==================================================== */}
        {portal === 'admin' && (
          <>
            {adminMode === 'login' && (
              <form onSubmit={handleAdminLogin} className="space-y-3.5">
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] flex items-start gap-2.5 text-xs text-[var(--foreground)]">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Authorized Personnel Only</strong>
                    <span className="text-[var(--muted-text)] text-[11px]">
                      Access controls courses, labs, tests, STEM hardware inventory, orders, and student accounts.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Username / Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted-text)]" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter username or email"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] pl-9 pr-3 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[var(--foreground)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminMode('change_password');
                        resetMessages();
                      }}
                      className="text-[11px] text-[var(--muted-text)] hover:text-[var(--foreground)] hover:underline cursor-pointer"
                    >
                      Change password
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted-text)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] pl-9 pr-10 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-xs sm:text-sm font-semibold text-[var(--background)] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    {loading ? (
                      <span>Verifying Authorization...</span>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {adminMode === 'change_password' && (
              <form onSubmit={handleAdminChangePassword} className="space-y-3">
                <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--muted-text)]">
                  Update the platform administrator access master password.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">New Master Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-xs sm:text-sm font-semibold text-[var(--background)] transition cursor-pointer"
                >
                  Save New Master Password
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminMode('login');
                    resetMessages();
                  }}
                  className="w-full text-center text-xs text-[var(--muted-text)] hover:text-[var(--foreground)] py-1"
                >
                  Cancel
                </button>
              </form>
            )}
          </>
        )}

        {/* PWA DOWNLOAD ON THE LOGIN MODAL */}
        <div className="mt-5 pt-4 border-t border-[var(--border)]">
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span>Download {branding.shortName || 'App'} (PWA)</span>
              </span>
              <p className="text-[10px] text-[var(--muted-text)] mt-0.5 truncate">
                Install for offline access and faster laboratory launch.
              </p>
            </div>

            {isInstalled ? (
              <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-semibold shrink-0">
                ✓ Installed
              </span>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={install}
                className="px-3 py-1.5 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>
            ) : isIOS ? (
              <button
                type="button"
                onClick={() => setShowIOSGuide(!showIOSGuide)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-medium transition cursor-pointer shrink-0"
              >
                iOS Guide
              </button>
            ) : (
              <button
                type="button"
                onClick={install}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-medium hover:bg-[var(--surface-secondary)] transition cursor-pointer shrink-0"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>
            )}
          </div>

          {showIOSGuide && (
            <div className="mt-2 p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] text-[var(--muted-text)] leading-relaxed">
              <strong>To install on iOS Safari:</strong> Tap the <strong>Share</strong> icon in the Safari toolbar, then tap <strong>Add to Home Screen</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
