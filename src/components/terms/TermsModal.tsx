import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { TermsAndConditions } from '../../types';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  terms: TermsAndConditions | null;
  onAccept?: () => void;
  isAcceptanceRequired?: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  terms,
  onAccept,
  isAcceptanceRequired = false,
}) => {
  const [agreed, setAgreed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  if (!isOpen || !terms) return null;

  const handleAccept = async () => {
    if (!agreed || !onAccept) return;
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-secondary)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--foreground)]/10 flex items-center justify-center text-[var(--foreground)]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)]">
                Terms & Conditions
              </h2>
              <p className="text-[11px] text-[var(--muted-text)]">
                Version {terms.version} • Published by {terms.updatedBy || 'Platform Owner'}
              </p>
            </div>
          </div>
          {!isAcceptanceRequired && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-xs sm:text-sm leading-relaxed space-y-4">
          <div className="whitespace-pre-wrap font-sans text-[var(--foreground)]/90 space-y-2 selection:bg-amber-200 selection:text-slate-900">
            {terms.content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          {isAcceptanceRequired ? (
            <>
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-[var(--foreground)] select-none">
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
                disabled={!agreed || loading}
                onClick={handleAccept}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-40 text-[var(--background)] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? (
                  <span>Saving Acceptance...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept & Continue</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
