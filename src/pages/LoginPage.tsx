import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Lock,
  Mail,
  User,
  Shield,
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Download,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
  defaultRole?: 'student' | 'admin';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateHome,
  defaultRole = 'student',
}) => {
  const {
    loginAdmin,
    validateStudentStepOne,
    verifyStudentStepTwo,
    registerStudentRequest,
    resetStudentPassword,
  } = useAuth();

  const { branding } = useBranding();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Exactly TWO portals: Student & Admin
  const [selectedPortal, setSelectedPortal] = useState<'student' | 'admin'>(defaultRole);
  const [studentMode, setStudentMode] = useState<'login' | 'register' | 'forgot_password' | 'otp_step'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student 4-digit OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handlePortalSwitch = (portal: 'student' | 'admin') => {
    setSelectedPortal(portal);
    resetMessages();
    setPassword('');
    setStudentMode('login');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (selectedPortal === 'admin') {
        await loginAdmin(email, password);
        setSuccessMsg('Administrator authenticated successfully.');
        setTimeout(onSuccess, 400);
        return;
      }

      // Student flows
      if (studentMode === 'forgot_password') {
        if (!email.trim()) throw new Error('Please enter your registered email address.');
        if (!newPassword.trim()) throw new Error('Please enter a new password.');
        await resetStudentPassword(email, newPassword);
        setSuccessMsg('Password reset successfully. You may now sign in.');
        setStudentMode('login');
        setPassword('');
        return;
      }

      if (studentMode === 'register') {
        if (!name.trim()) throw new Error('Full name is required.');
        if (!email.trim()) throw new Error('Email address is required.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const res = await registerStudentRequest(name, email, phone, undefined, undefined, password);
        setSuccessMsg(res.message || 'Account registered! Please sign in with your credentials.');
        setStudentMode('login');
        return;
      }

      // Student login step 1
      await validateStudentStepOne(email, password);
      setStudentMode('otp_step');
      setOtpDigits(['', '', '', '']);
      setSuccessMsg('Credentials verified. Enter your 4-digit security code to proceed.');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 4-Digit OTP Confirmation
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 4) {
      setError('Please enter all 4 digits of the security verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyStudentStepTwo(email, fullOtp);
      setSuccessMsg('Authentication confirmed. Entering platform...');
      setTimeout(onSuccess, 400);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Top Header & Home Navigation */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-6 z-10">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
        >
          <span>← Back to Platform</span>
        </button>

        {isInstallable && !isInstalled && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] text-xs font-semibold hover:bg-[var(--surface)] transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}
      </div>

      {/* Main Login Card - Loads Directly With Zero Video */}
      <div className="max-w-md w-full mx-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl transition-colors duration-200">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Innolink Technologies
          </h1>
          <p className="text-xs text-[var(--muted-text)] mt-1">
            {selectedPortal === 'admin' ? 'Owner Portal' : 'Student Learning & Lab Access'}
          </p>
        </div>

        {/* ONLY TWO PORTALS: Student & Owner */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] mb-6">
          <button
            type="button"
            onClick={() => handlePortalSwitch('student')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedPortal === 'student'
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs border border-[var(--border)]'
                : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            onClick={() => handlePortalSwitch('admin')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedPortal === 'admin'
                ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Owner Portal</span>
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* OTP Step for Student */}
        {selectedPortal === 'student' && studentMode === 'otp_step' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-[var(--muted-text)]">
                Enter your 4-digit security code for:
              </p>
              <p className="text-xs font-mono font-semibold text-[var(--foreground)]">{email}</p>
            </div>

            <div className="flex justify-center gap-2.5 pt-2">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputsRef.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-mono font-bold rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length !== 4}
              className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-[var(--background)] font-semibold text-xs sm:text-sm transition cursor-pointer shadow-xs"
            >
              {loading ? 'Verifying...' : 'Verify & Enter Platform'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStudentMode('login');
                resetMessages();
              }}
              className="w-full text-center text-xs text-[var(--muted-text)] hover:text-[var(--foreground)]"
            >
              ← Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedPortal === 'student' && studentMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted-text)]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] pl-9 pr-3 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                {selectedPortal === 'admin' ? 'Username / Email' : 'Student Email'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted-text)]" />
                <input
                  type={selectedPortal === 'admin' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedPortal === 'admin' ? 'Enter username or email' : 'student@example.com'}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] pl-9 pr-3 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>
            </div>

            {selectedPortal === 'student' && studentMode === 'forgot_password' ? (
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted-text)]" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] pl-9 pr-3 py-2 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--foreground)]">
                    Password
                  </label>
                  {selectedPortal === 'student' && studentMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('forgot_password');
                        resetMessages();
                      }}
                      className="text-[11px] text-[var(--muted-text)] hover:text-[var(--foreground)] hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
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
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-[var(--background)] font-semibold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <span>
                {loading
                  ? 'Processing...'
                  : selectedPortal === 'admin'
                  ? 'Sign In'
                  : studentMode === 'forgot_password'
                  ? 'Update Password'
                  : studentMode === 'register'
                  ? 'Register Student Account'
                  : 'Continue to Security Verification'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {selectedPortal === 'student' && (
              <div className="pt-2 border-t border-[var(--border)] text-center text-xs text-[var(--muted-text)]">
                {studentMode === 'forgot_password' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentMode('login');
                      resetMessages();
                    }}
                    className="text-[var(--foreground)] hover:underline cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                ) : studentMode === 'register' ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('login');
                        resetMessages();
                      }}
                      className="text-[var(--foreground)] font-semibold hover:underline cursor-pointer ml-1"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    New student?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('register');
                        resetMessages();
                      }}
                      className="text-[var(--foreground)] font-semibold hover:underline cursor-pointer ml-1"
                    >
                      Register Now
                    </button>
                  </span>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
