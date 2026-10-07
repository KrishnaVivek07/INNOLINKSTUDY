import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  Key,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useLMS } from '../context/LMSContext';

export interface PaymentStatusData {
  orderId: string;
  paymentId: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  courseKey: string;
  emailStatus: 'SENT' | 'PENDING' | 'FAILED';
  studentEmail: string;
  verifiedAt: string;
}

interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusData: PaymentStatusData | null;
  onGoToLearning: () => void;
  onRedeemKey?: (key: string) => void;
}

export const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  isOpen,
  onClose,
  statusData,
  onGoToLearning,
  onRedeemKey,
}) => {
  const { resendCourseKey, redeemAccessKey } = useLMS();

  const [copiedKey, setCopiedKey] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [currentEmailStatus, setCurrentEmailStatus] = useState<'SENT' | 'PENDING' | 'FAILED'>('PENDING');

  useEffect(() => {
    if (statusData) {
      setCurrentEmailStatus(statusData.emailStatus);
    }
  }, [statusData]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  if (!isOpen || !statusData) return null;

  const handleCopyKey = () => {
    if (statusData.courseKey) {
      navigator.clipboard.writeText(statusData.courseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendMessage(null);

    try {
      const res = await resendCourseKey(statusData.orderId);
      setCurrentEmailStatus(res.emailStatus as any);
      setResendMessage({
        text: res.message || `Course key resent to ${statusData.studentEmail}`,
        isError: res.emailStatus === 'FAILED',
      });
      setCooldown(60); // 60s rate limit
    } catch (err: any) {
      setResendMessage({
        text: err.message || 'Failed to resend course key. Please try again later.',
        isError: true,
      });
      setCooldown(30);
    } finally {
      setResending(false);
    }
  };

  const handleRedeemNow = async () => {
    try {
      if (onRedeemKey) {
        onRedeemKey(statusData.courseKey);
      } else {
        await redeemAccessKey(statusData.courseKey);
        onGoToLearning();
      }
    } catch (e) {
      // Key already unlocked or redeemed
      onGoToLearning();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 text-slate-100 shadow-2xl">
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                InnoLink Billing Gateway
              </div>
              <div className="text-xs text-[var(--muted-text)] font-mono">
                Order ID: {statusData.orderId}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Server Verified</span>
          </span>
        </div>

        {/* STEP PROGRESSION FLOW */}
        {/* Processing Payment -> Payment Verified -> Course Key Sent -> Go to My Learning */}
        <div className="py-2 mb-6">
          <div className="space-y-3">
            {/* Step 1: Processing */}
            <div className="flex items-center gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-white">1. Processing Payment</span>
                <span className="text-[11px] text-[var(--muted-text)] ml-2">Gateway authorization complete</span>
              </div>
            </div>

            {/* Connecting line */}
            <div className="w-0.5 h-2 bg-emerald-500/40 ml-3" />

            {/* Step 2: Payment Verified */}
            <div className="flex items-center gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-white">2. Payment Verified</span>
                <span className="text-[11px] text-emerald-400 font-mono ml-2">
                  ${statusData.amount} {statusData.currency} Confirmed
                </span>
              </div>
            </div>

            {/* Connecting line */}
            <div className="w-0.5 h-2 bg-emerald-500/40 ml-3" />

            {/* Step 3: Course Key Sent */}
            <div className="flex items-center gap-3 text-xs">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                  currentEmailStatus === 'SENT'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {currentEmailStatus === 'SENT' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1">
                <span className="font-semibold text-white">3. Course Key Email</span>
                {currentEmailStatus === 'SENT' ? (
                  <span className="text-[11px] text-emerald-400 ml-2">
                    Sent to {statusData.studentEmail}
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-300 ml-2">
                    Delivery Pending (Key stored safely below)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* EMAIL FAILURE OR SUCCESS BANNER */}
        {currentEmailStatus === 'SENT' ? (
          <div className="p-3.5 mb-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-200">
                Course Key Sent to your verified email
              </div>
              <div className="text-[11px] text-emerald-300/80 mt-0.5">
                We sent your unique activation key to <span className="font-mono text-emerald-200">{statusData.studentEmail}</span>.
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 mb-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-100">
                Payment successful. We couldn't send the email yet.
              </div>
              <div className="text-[11px] text-amber-200/90 mt-0.5">
                Your course access is safe. Your unique key is shown below. Please use <span className="font-semibold">Resend Course Key</span> if needed.
              </div>
            </div>
          </div>
        )}

        {/* COURSE & ACTIVATION KEY BOX */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted-text)]">Purchased Course:</span>
            <span className="font-semibold text-white truncate max-w-xs">{statusData.courseTitle}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted-text)]">Payment Reference:</span>
            <span className="font-mono text-slate-300">{statusData.paymentId}</span>
          </div>

          {/* Key Display Card */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-[var(--muted-text)] block mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Your Unique Course Activation Key:</span>
            </span>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-cyan-500/40 font-mono">
              <span className="text-sm sm:text-base font-extrabold text-cyan-300 tracking-wider select-all">
                {statusData.courseKey}
              </span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Copy Key"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[var(--muted-text)] mt-1.5">
              One-time use key linked to your account. You can use it in "Redeem Course" anytime.
            </p>
          </div>
        </div>

        {/* Resend status message */}
        {resendMessage && (
          <div
            className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2 ${
              resendMessage.isError
                ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
            }`}
          >
            {resendMessage.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{resendMessage.text}</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onGoToLearning}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Go to My Learning</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleRedeemNow}
              className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Redeem Course</span>
            </button>

            <button
              type="button"
              disabled={resending || cooldown > 0}
              onClick={handleResend}
              className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Resending...</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--muted-text)]" />
                  <span>Resend ({cooldown}s)</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Resend Course Key</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
