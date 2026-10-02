import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Smartphone,
  Key,
  ShieldAlert,
  Phone,
  BookOpen,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'student_login' | 'mentor_login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'student_login',
}) => {
  const {
    loginMentor,
    registerStudentRequest,
    validateStudentStepOne,
    verifyStudentStepTwo,
    resetMentorPasswordLocal,
  } = useAuth();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [mode, setMode] = useState<'login' | 'register' | 'otp_step' | 'mentor_reset'>(
    initialMode === 'register' ? 'register' : 'login'
  );

  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor'>(
    initialMode === 'mentor_login' ? 'mentor' : 'student'
  );

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 4-Digit OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [generatedOtpDisplay, setGeneratedOtpDisplay] = useState<string | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Mentor Reset State
  const [newMentorPass, setNewMentorPass] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (mode === 'otp_step' && otpInputsRef.current[0]) {
      otpInputsRef.current[0].focus();
    }
  }, [mode]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // 1. Student / Mentor Login Step 1
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (selectedRole === 'mentor') {
        await loginMentor(email, password);
        onClose();
      } else {
        // Strict Student Login Step 1
        const res = await validateStudentStepOne(email, password);
        setGeneratedOtpDisplay(res.generatedOtp);
        setMode('otp_step');
        setOtpDigits(['', '', '', '']);
        setSuccessMessage('Credentials verified. Please enter the 4-digit security OTP to complete authentication.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Strict Student Login Step 2 (4-Digit OTP)
  const handleOtpSubmit = async (e: React.FormEvent) => {
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
      setSuccessMessage('Security verification successful! Access granted.');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Invalid 4-digit OTP. Access strictly denied.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Student Registration & Course Application
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await registerStudentRequest(name, email, phone);
      setSuccessMessage(res.message);
      setName('');
      setPhone('');
      setTimeout(() => {
        setMode('login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Mentor Password Reset
  const handleMentorReset = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    try {
      resetMentorPasswordLocal(newMentorPass);
      setSuccessMessage('Mentor password updated successfully! Please sign in with your new password.');
      setMode('login');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update mentor password.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-7 text-slate-100 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase">
              InnoLink Technologies
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {mode === 'login' && (selectedRole === 'mentor' ? 'Faculty Mentor Sign In' : 'Student Sign In')}
            {mode === 'register' && 'Student Course Registration'}
            {mode === 'otp_step' && 'Security OTP Verification'}
            {mode === 'mentor_reset' && 'Reset Mentor Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' &&
              (selectedRole === 'mentor'
                ? 'Single authorized faculty mentor access. Only the designated platform mentor can authenticate here.'
                : 'Enter your email and the password authorized by your faculty mentor.')}
            {mode === 'register' &&
              'Submit enrollment. Your mentor will authorize your email and issue your password in the Mentor Portal.'}
            {mode === 'otp_step' && 'Enter the 4-digit security code to verify your authorized session.'}
            {mode === 'mentor_reset' && 'Update your faculty mentor access password.'}
          </p>
        </div>

        {/* Role Selector Tabs (Only in Login mode) */}
        {mode === 'login' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('student');
                resetMessages();
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                selectedRole === 'student'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('mentor');
                resetMessages();
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                selectedRole === 'mentor'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mentor Portal
            </button>
          </div>
        )}

        {/* Error and Success Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* 1. LOGIN FORM (Step 1) */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {selectedRole === 'mentor' ? 'Mentor Username or Email' : 'Student Email Address'}
              </label>
              <div className="relative">
                {selectedRole === 'mentor' ? (
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                ) : (
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                )}
                <input
                  type={selectedRole === 'mentor' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'mentor' ? 'innolink' : 'student@example.com'}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {selectedRole === 'mentor' ? 'Mentor Password' : 'Mentor-Authorized Password'}
                </label>
                {selectedRole === 'mentor' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('mentor_reset');
                      resetMessages();
                    }}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Reset Password
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {selectedRole === 'student' && (
                <p className="text-[11px] text-slate-500 mt-1">
                  * Note: Only mentor-authorized student credentials are authenticated.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                selectedRole === 'mentor'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-cyan-600 hover:bg-cyan-500'
              }`}
            >
              {loading ? (
                <span>Validating Credentials...</span>
              ) : (
                <>
                  <span>{selectedRole === 'mentor' ? 'Sign In as Faculty Mentor' : 'Continue to 4-Digit OTP'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {selectedRole === 'student' && (
              <div className="pt-2 text-center text-xs text-slate-400">
                New student?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    resetMessages();
                  }}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Submit Registration Request
                </button>
              </div>
            )}
          </form>
        )}

        {/* 2. STRICT 4-DIGIT OTP STEP (Student) */}
        {mode === 'otp_step' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            {/* Display 4-digit code notification */}
            {generatedOtpDisplay && (
              <div className="p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-center space-y-1">
                <span className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider block">
                  Security OTP Dispatch Notice
                </span>
                <span className="text-xl font-bold font-mono tracking-widest text-cyan-300 select-all block">
                  {generatedOtpDisplay}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Enter the exact 4-digit code below to unlock student access
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                Enter 4-Digit Security Code
              </label>
              <div className="flex justify-center items-center gap-3">
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
                    className="w-12 h-12 text-center text-xl font-bold font-mono text-cyan-300 bg-slate-950 border border-slate-700 rounded-xl focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length !== 4}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs sm:text-sm font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loading ? (
                <span>Verifying Security Code...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP & Launch Dashboard</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetMessages();
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* 3. STUDENT REGISTRATION FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student Name"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-cyan-400 block">Strict Mentor Verification Process:</span>
              <p>
                1. After submitting, your registration will be reviewed by the faculty mentor.<br />
                2. The mentor will authorize your email and assign your authorized login password.<br />
                3. You will receive your credentials to sign in with 4-digit OTP verification.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs sm:text-sm font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loading ? <span>Submitting...</span> : <span>Submit for Mentor Authorization</span>}
            </button>

            <div className="text-center text-xs text-slate-400 pt-1">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetMessages();
                }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 4. MENTOR RESET */}
        {mode === 'mentor_reset' && (
          <form onSubmit={handleMentorReset} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Mentor Password</label>
              <input
                type="password"
                required
                value={newMentorPass}
                onChange={(e) => setNewMentorPass(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white transition cursor-pointer"
            >
              Save New Mentor Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetMessages();
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        )}

        {/* PWA DOWNLOAD ON THE LOGIN PAGE */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="p-3 rounded-2xl border border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Download InnoLink App (PWA)</span>
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                Install for offline video labs and instant notifications.
              </p>
            </div>

            {isInstalled ? (
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold shrink-0">
                ✓ Installed
              </span>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={install}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md shadow-cyan-600/20"
              >
                <Download className="w-3 h-3" />
                <span>Install App</span>
              </button>
            ) : isIOS ? (
              <button
                type="button"
                onClick={() => setShowIOSGuide(!showIOSGuide)}
                className="px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-medium transition cursor-pointer shrink-0"
              >
                iOS Guide
              </button>
            ) : (
              <button
                type="button"
                onClick={install}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition cursor-pointer shrink-0"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>
            )}
          </div>

          {showIOSGuide && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-[11px] text-slate-300 leading-relaxed">
              <strong>To install on iOS Safari:</strong> Tap the <strong className="text-cyan-400">Share</strong> icon in your browser toolbar, then tap <strong className="text-cyan-400">Add to Home Screen</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
