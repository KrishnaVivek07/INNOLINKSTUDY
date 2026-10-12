import React from 'react';
import { Home, ArrowLeft, BookOpen, Cpu, ShoppingBag, AlertTriangle, Compass } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  onNavigateToTab,
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:py-16 text-[var(--foreground)] bg-[var(--background)]">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Original Animated Circuit Trace SVG Illustration */}
        <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full text-slate-800 dark:text-slate-700/60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* PCB Grid Background */}
            <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
            <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1" opacity="0.3" />

            {/* Circuit Traces */}
            <path
              d="M 30 100 L 75 100 L 90 85 L 110 85"
              stroke="#06b6d4"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Broken / Open Circuit Gap */}
            <path
              d="M 125 85 L 140 85 L 155 100 L 170 100"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="3 3"
            />
            <path
              d="M 100 30 L 100 65 L 85 80"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 100 170 L 100 135 L 115 120 L 130 120"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Solder Pads & Test Points */}
            <circle cx="30" cy="100" r="5" fill="#06b6d4" />
            <circle cx="170" cy="100" r="5" fill="#ef4444" />
            <circle cx="100" cy="30" r="4" fill="#10b981" />
            <circle cx="100" cy="170" r="4" fill="#f59e0b" />

            {/* Central Broken Node Indicator */}
            <circle cx="117.5" cy="85" r="7" stroke="#ef4444" strokeWidth="2" fill="none" className="animate-ping" opacity="0.6" />
            <circle cx="117.5" cy="85" r="4" fill="#ef4444" />
          </svg>

          {/* Center 404 Badge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
            <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-[var(--foreground)] drop-shadow-sm">
              404
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-500 font-bold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>CIRCUIT OPEN</span>
            </span>
          </div>
        </div>

        {/* Heading & Concise Message */}
        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Route Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-text)] leading-relaxed max-w-md mx-auto">
            The signal path could not be traced. The requested page or lab circuit has been moved, reconfigured, or does not exist.
          </p>
        </div>

        {/* Primary Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-[var(--background)] bg-[var(--foreground)] hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </button>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-xs sm:text-sm font-medium text-[var(--foreground)] transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Helpful Shortcut Destinations */}
        <div className="pt-6 border-t border-[var(--border)]">
          <span className="text-[11px] font-semibold text-[var(--muted-text)] uppercase tracking-wider block mb-3">
            Explore InnoLink Technologies:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateToTab('courses')}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
              <span>Electronics Courses</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('coding_lab')}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              <span>Virtual Coding Lab</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('marketplace')}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
              <span>STEM Hardware Store</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
