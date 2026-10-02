import React from 'react';
import { Cpu, ShieldCheck, Award, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-auto border-t border-slate-800/80 bg-slate-950/90 text-slate-400">
      {/* Subtle circuit top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white">InnoLink</span>{' '}
                <span className="text-lg font-bold tracking-tight text-cyan-400">Technologies</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Premier electronics and technology learning management system. Master circuit analysis, embedded firmware, and PCB hardware fabrication with mentor guidance and AI-powered study assistance.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Electronics Mentorship & Verification</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Curriculum</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><span className="hover:text-cyan-400 transition cursor-pointer">Electronics Fundamentals</span></li>
              <li><span className="hover:text-cyan-400 transition cursor-pointer">Embedded & Microcontrollers</span></li>
              <li><span className="hover:text-cyan-400 transition cursor-pointer">High-Speed PCB Design</span></li>
              <li><span className="hover:text-cyan-400 transition cursor-pointer">Semiconductor Physics</span></li>
            </ul>
          </div>

          {/* Platform Standards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Portal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><span className="hover:text-cyan-400 transition cursor-pointer">Progressive Web App (PWA)</span></li>
              <li><span className="hover:text-cyan-400 transition cursor-pointer">Gemini AI Study Assistant</span></li>
              <li><span className="hover:text-cyan-400 transition cursor-pointer">Course Activation Keys</span></li>
              <li><span className="hover:text-cyan-400 transition cursor-pointer">Verified Certification</span></li>
            </ul>
          </div>
        </div>

        {/* Mandatory Footer Text as per User Requirement */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-slate-200">InnoLink Technologies</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-cyan-400 font-medium">Powered by MK Solutions</span>
          </div>

          <div className="text-slate-400 text-center sm:text-right">
            © 2026 InnoLink Technologies. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
