import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Award,
  X,
  Play,
} from 'lucide-react';
import { CodingLab } from '../../types';

interface CurriculumLessonSidebarProps {
  labs: CodingLab[];
  activeLabId: string;
  onSelectLab: (labId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  completedLabIds?: string[];
  onToggleCompleteLab?: (labId: string) => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  className?: string;
}

export const CurriculumLessonSidebar: React.FC<CurriculumLessonSidebarProps> = ({
  labs,
  activeLabId,
  onSelectLab,
  isOpen,
  onToggleOpen,
  completedLabIds = [],
  onToggleCompleteLab,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
  className = '',
}) => {
  const completedCount = completedLabIds.length;
  const totalCount = labs.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const activeIndex = labs.findIndex((l) => l.id === activeLabId);
  const activeLessonNum = activeIndex !== -1 ? activeIndex + 1 : 1;

  const renderContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full bg-[var(--surface)] text-[var(--foreground)] border-r border-[var(--border)] select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Course Curriculum
              </h2>
              <span className="text-[11px] text-[var(--muted-text)]">
                Lesson {activeLessonNum} of {totalCount}
              </span>
            </div>
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleOpen}
              className="p-1 rounded-md hover:bg-[var(--surface)] text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
              title="Collapse Curriculum Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--muted-text)]">
            <span className="flex items-center gap-1 font-medium">
              <Award className="w-3 h-3 text-amber-500" />
              <span>Student Progress</span>
            </span>
            <span className="font-semibold text-[var(--foreground)]">
              {completedCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lesson List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 overscroll-contain">
        {labs.map((lab, index) => {
          const isActive = lab.id === activeLabId;
          const isCompleted = completedLabIds.includes(lab.id);
          const lessonNumber = String(index + 1).padStart(2, '0');

          return (
            <div
              key={lab.id}
              className={`group relative rounded-xl border p-2.5 transition cursor-pointer ${
                isActive
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] hover:border-[var(--muted-text)]'
              }`}
              onClick={() => {
                onSelectLab(lab.id);
                if (isMobile && onCloseMobileDrawer) {
                  onCloseMobileDrawer();
                }
              }}
            >
              <div className="flex items-start gap-2.5">
                {/* Lesson number badge or completion check */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompleteLab?.(lab.id);
                  }}
                  className="mt-0.5 shrink-0 text-left cursor-pointer"
                  title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full border text-[9px] font-mono font-bold flex items-center justify-center ${
                        isActive
                          ? 'border-cyan-500 text-cyan-500 bg-cyan-500/20'
                          : 'border-[var(--muted-text)] text-[var(--muted-text)]'
                      }`}
                    >
                      {index + 1}
                    </div>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-[var(--muted-text)] uppercase">
                      L-{lessonNumber}
                    </span>
                    <span
                      className={`text-xs font-semibold leading-snug line-clamp-2 ${
                        isActive ? 'text-cyan-500' : 'text-[var(--foreground)]'
                      }`}
                    >
                      {lab.title.replace(/^Lab \d+:\s*/i, '')}
                    </span>
                  </div>

                  {/* Board and language tag */}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--muted-text)]">
                    <span className="px-1.5 py-0.2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[9px] font-medium uppercase font-mono">
                      {lab.board.replace('_', ' ')}
                    </span>
                    {isActive && (
                      <span className="text-cyan-500 font-semibold flex items-center gap-0.5 text-[10px]">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Instructions / Quick Tip */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-secondary)]/30 text-[11px] text-[var(--muted-text)] shrink-0">
        <p className="line-clamp-2">
          Click any lesson to load starter circuit, wiring guide and verified code template.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ${className} ${
          isOpen ? 'w-64 xl:w-72' : 'w-0 overflow-hidden border-none'
        }`}
      >
        {isOpen && renderContent(false)}
      </div>

      {/* Collapsed Rail Button on Desktop (when closed) */}
      {!isOpen && (
        <div className="hidden lg:flex flex-col items-center py-2 px-1 border-r border-[var(--border)] bg-[var(--surface)] shrink-0">
          <button
            type="button"
            onClick={onToggleOpen}
            className="p-2 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--muted-text)] hover:text-cyan-500 transition cursor-pointer"
            title="Expand Curriculum Lessons Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="mt-4 [writing-mode:vertical-lr] rotate-180 text-xs font-bold tracking-wider text-[var(--muted-text)] uppercase flex items-center gap-2">
            <span>Lessons ({completedCount}/{totalCount})</span>
          </div>
        </div>
      )}

      {/* Mobile Drawer (Modal Slide-over) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileDrawer}
          />
          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs h-full bg-[var(--surface)] shadow-2xl z-10">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
