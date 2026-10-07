import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  X,
  Smartphone,
  Building,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Course } from '../types';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  verifiedStudentEmail: string;
  studentName?: string;
  onConfirmPayment: (method: 'card' | 'upi' | 'netbanking') => Promise<void>;
  isProcessing: boolean;
  statusText: string;
  errorMessage: string | null;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  course,
  verifiedStudentEmail,
  onConfirmPayment,
  isProcessing,
  statusText,
  errorMessage,
}) => {
  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking'>('card');

  // Clean empty inputs - no hardcoded credentials
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmPayment(method);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--foreground)] shadow-2xl transition-colors">
        {/* Close Button */}
        {!isProcessing && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Security Badge */}
        <div className="flex items-center gap-2 mb-2 text-emerald-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Secure Payment Gateway
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ml-auto">
            PCI-DSS COMPLIANT
          </span>
        </div>

        <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Checkout</h3>
        <p className="text-xs text-[var(--muted-text)] truncate mb-4">{course.title}</p>

        {/* Amount Box */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] mb-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[var(--muted-text)] block font-medium">Course Fee</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-[var(--foreground)]">${course.price}</span>
              <span className="text-xs text-[var(--muted-text)] font-mono">USD</span>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Encrypted</span>
            </span>
            <span className="text-[10px] text-[var(--muted-text)] block mt-1">One-time enrollment</span>
          </div>
        </div>

        {/* Verified Email Notice */}
        <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] mb-4 text-[11px] text-[var(--muted-text)] flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Access key will be sent to:{' '}
            <strong className="text-[var(--foreground)] font-mono">{verifiedStudentEmail}</strong>
          </span>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isProcessing ? (
          <div className="py-8 text-center space-y-3">
            <div className="relative mx-auto w-10 h-10">
              <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-[var(--foreground)] animate-pulse">{statusText}</p>
              <p className="text-[11px] text-[var(--muted-text)]">
                Authorizing transaction credentials...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  method === 'card'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs border border-[var(--border)]'
                    : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  method === 'upi'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs border border-[var(--border)]'
                    : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  method === 'netbanking'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs border border-[var(--border)]'
                    : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>NetBanking</span>
              </button>
            </div>

            {/* CARD METHOD */}
            {method === 'card' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="•••• •••• •••• ••••"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                    />
                    <CreditCard className="w-4 h-4 text-[var(--muted-text)] absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="•••"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UPI METHOD */}
            {method === 'upi' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                    UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* NETBANKING METHOD */}
            {method === 'netbanking' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                  Select Bank
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2 rounded-lg border text-left font-medium transition cursor-pointer ${
                        selectedBank === bank
                          ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pay Now Button */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Authorize & Pay ${course.price}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
