import React from 'react';
import { Award, CheckCircle2, Download, Printer, X, Cpu, ShieldCheck } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  courseTitle: string;
  certificateId: string;
  completedDate: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  studentName,
  courseTitle,
  certificateId,
  completedDate,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8">
        {/* Floating actions */}
        <div className="flex items-center justify-end gap-2 mb-3 no-print">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-lg"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Certificate</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Card Printable Container */}
        <div className="relative rounded-3xl border-4 border-amber-500/50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 text-slate-100 shadow-2xl overflow-hidden print:border-black print:text-black print:bg-white">
          {/* Ornamental Circuit Watermark Border */}
          <div className="absolute inset-2 border border-cyan-500/20 rounded-2xl pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Certificate Header */}
          <div className="text-center space-y-2 mb-8 relative z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xl font-extrabold tracking-wider uppercase text-cyan-400">
                InnoLink Technologies
              </span>
            </div>
            <div className="text-[11px] uppercase tracking-widest text-slate-400">
              Department of Electronics & Hardware Engineering
            </div>

            <div className="py-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-300 tracking-wide">
                Certificate of Completion
              </h1>
              <p className="text-xs text-slate-300 italic mt-1">
                This is to officially certify that
              </p>
            </div>

            {/* Student Name */}
            <div className="py-2 border-b border-cyan-500/30 max-w-md mx-auto">
              <span className="text-2xl sm:text-3xl font-serif font-extrabold text-white tracking-wide">
                {studentName}
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-lg mx-auto pt-2 leading-relaxed">
              has successfully fulfilled all curriculum requirements, passed comprehensive laboratory tests, and mastered circuit engineering in
            </p>

            {/* Course Title */}
            <h3 className="text-lg sm:text-xl font-bold text-cyan-300 py-1">
              {courseTitle}
            </h3>
          </div>

          {/* Footer of Certificate */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400 relative z-10">
            <div className="text-center sm:text-left">
              <div className="font-serif italic text-white text-base">Prof. K. Prabhala</div>
              <div className="text-[11px] text-slate-400 border-t border-slate-700 pt-1 mt-1">
                Lead Mentor & Curriculum Chair
              </div>
            </div>

            {/* Gold Seal Emblem */}
            <div className="h-16 w-16 rounded-full border-2 border-amber-400 bg-amber-950/40 text-amber-300 flex flex-col items-center justify-center text-center shadow-lg">
              <Award className="w-6 h-6 text-amber-400" />
              <span className="text-[8px] font-bold uppercase tracking-tighter">Verified</span>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <div className="font-mono text-[11px] text-cyan-400">ID: {certificateId}</div>
              <div className="text-[11px] text-slate-400">Date: {new Date(completedDate).toLocaleDateString()}</div>
              <div className="text-[10px] text-slate-400 font-medium">Powered by MK Solutions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
