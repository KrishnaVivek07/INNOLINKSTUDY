import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLMS } from '../../context/LMSContext';
import { Lock, ShieldAlert, ArrowRight, BookOpen, CheckCircle2, RefreshCw } from 'lucide-react';

interface CodingLabAccessGateProps {
  courseId: string;
  courseTitle?: string;
  onViewCourses: () => void;
  children: React.ReactNode;
}

export const CodingLabAccessGate: React.FC<CodingLabAccessGateProps> = ({
  courseId,
  courseTitle = 'Electronics Engineering Curriculum',
  onViewCourses,
  children,
}) => {
  const { currentUser, role } = useAuth();
  const { isEnrolled, courses } = useLMS();

  const [isVerifying, setIsVerifying] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const matchedCourse = courses.find((c) => c.id === courseId) || courses[0];
  const activeCourseId = matchedCourse?.id || courseId;
  const activeCourseTitle = matchedCourse?.title || courseTitle;

  useEffect(() => {
    let isMounted = true;

    async function checkBackendAccess() {
      setIsVerifying(true);
      setErrorMessage(null);

      // 1. Check if user is authenticated
      if (!currentUser) {
        if (isMounted) {
          setAccessGranted(false);
          setIsVerifying(false);
        }
        return;
      }

      // 2. Admins have authorized access
      if (role === 'admin' || currentUser.email === 'karthikeyaprabhala2005@gmail.com') {
        if (isMounted) {
          setAccessGranted(true);
          setIsVerifying(false);
        }
        return;
      }

      // 3. Check client LMS enrollment status first
      const clientEnrolled = isEnrolled(activeCourseId);

      // 4. Server-Side Verification against /api/lab/verify-access
      try {
        const res = await fetch('/api/lab/verify-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: activeCourseId,
            studentId: currentUser.uid,
            studentEmail: currentUser.email,
            role: currentUser.role,
          }),
        });

        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.allowed) {
            setAccessGranted(true);
          } else if (clientEnrolled) {
            // If client has active authorized enrollment or redeem key in local state
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
            setErrorMessage(data.error || 'Access restricted to enrolled students.');
          }
        }
      } catch (err) {
        // Fallback to strict client enrollment check if network glitch
        if (isMounted) {
          if (clientEnrolled) {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
          }
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    }

    checkBackendAccess();

    return () => {
      isMounted = false;
    };
  }, [currentUser, role, activeCourseId, isEnrolled]);

  if (isVerifying) {
    return (
      <div className="py-24 px-4 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white tracking-tight">Verifying Course Enrollment</h3>
          <p className="text-xs text-slate-400">Authenticating student authorization for Coding & Hardware Lab...</p>
        </div>
      </div>
    );
  }

  // Access Denied Screen (Strict Requirement)
  if (!accessGranted) {
    return (
      <div className="py-20 sm:py-28 px-4 max-w-md mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400">
            <span>Innolink Technologies</span>
            <span>•</span>
            <span>Security Gate</span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">Coding & Hardware Lab</h2>
          <p className="text-sm text-slate-300 font-medium">This lab is available to enrolled students.</p>

          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Hands-on ESP32, Arduino, and Raspberry Pi Pico coding workspaces are protected resources linked directly to{' '}
            <strong className="text-slate-200">{activeCourseTitle}</strong>.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 text-left">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onViewCourses}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>View Courses</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Already purchased? Ensure you are signed in with your authorized student account or redeem your course key.
        </p>
      </div>
    );
  }

  // Access Granted: Render Lab
  return <>{children}</>;
};
