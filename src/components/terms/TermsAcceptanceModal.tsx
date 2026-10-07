import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getTermsAndConditions,
  checkStudentTermsAcceptance,
  recordStudentTermsAcceptance,
} from '../../services/termsService';
import { TermsAndConditions } from '../../types';
import { FileText, CheckCircle2 } from 'lucide-react';

export const TermsAcceptanceModal: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [terms, setTerms] = useState<TermsAndConditions | null>(null);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function evaluateAcceptance() {
      if (!currentUser || role !== 'student') {
        if (isMounted) setNeedsAcceptance(false);
        return;
      }

      try {
        const currentTerms = await getTermsAndConditions();
        if (!isMounted) return;
        setTerms(currentTerms);

        if (currentTerms.published) {
          const { accepted } = await checkStudentTermsAcceptance(
            currentUser.uid,
            currentTerms.version
          );
          if (isMounted) {
            setNeedsAcceptance(!accepted);
          }
        } else {
          if (isMounted) setNeedsAcceptance(false);
        }
      } catch (err) {
        console.warn('Terms evaluation notice:', err);
      }
    }

    evaluateAcceptance();

    return () => {
      isMounted = false;
    };
  }, [currentUser, role]);

  const handleAcceptAndContinue = async () => {
    if (!currentUser || !terms || !agreed) return;

    setSubmitting(true);
    try {
      await recordStudentTermsAcceptance(currentUser.uid, terms.version);
      setToastMsg('Terms & Conditions accepted.');
      setNeedsAcceptance(false);
      setTimeout(() => {
        setToastMsg(null);
      }, 3000);
    } catch (err) {
      console.error('Acceptance submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {needsAcceptance && terms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-secondary)]/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--foreground)]/10 flex items-center justify-center text-[var(--foreground)]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)]">
                  Terms & Conditions
                </h2>
                <p className="text-xs text-[var(--muted-text)]">
                  Please review and accept our platform terms (Version {terms.version}) to continue.
                </p>
              </div>
            </div>

            {/* Scrollable Terms Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 text-xs sm:text-sm leading-relaxed max-h-[60vh] border-b border-[var(--border)]">
              <div className="whitespace-pre-wrap font-sans text-[var(--foreground)]/90 space-y-2">
                {terms.content}
              </div>
            </div>

            {/* Footer with Checkbox & Accept Button */}
            <div className="px-6 py-4 bg-[var(--surface-secondary)]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[var(--foreground)] select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[var(--foreground)] focus:ring-[var(--foreground)] cursor-pointer"
                />
                <span>I have read and agree to the Terms & Conditions</span>
              </label>

              <button
                type="button"
                disabled={!agreed || submitting}
                onClick={handleAcceptAndContinue}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-40 text-[var(--background)] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {submitting ? (
                  <span>Recording Acceptance...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept & Continue</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
