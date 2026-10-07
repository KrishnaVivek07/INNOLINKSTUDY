import React, { useState } from 'react';
import { useLMS } from '../context/LMSContext';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Clock,
  Award,
  Lock,
  CheckCircle2,
  ArrowRight,
  Key,
  Search,
} from 'lucide-react';

interface CoursesPageProps {
  onSelectCourse: (courseId: string) => void;
  openAuthModal: (mode: 'student_login' | 'admin_login' | 'register') => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ onSelectCourse, openAuthModal }) => {
  const { courses, lessons, modules, isEnrolled, getCourseProgress, redeemAccessKey } = useLMS();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [keyInput, setKeyInput] = useState('');
  const [keyMessage, setKeyMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const categories = ['All', 'Hardware & Circuits', 'Embedded & IoT', 'PCB & Fabrication', 'Robotics & Control'];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleRedeemKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    if (!currentUser) {
      openAuthModal('student_login');
      return;
    }

    setRedeeming(true);
    setKeyMessage(null);
    try {
      const res = await redeemAccessKey(keyInput);
      setKeyMessage({
        text: `Success! Unlocked access to ${res.courseTitle}`,
        isError: false,
      });
      setKeyInput('');
    } catch (err: any) {
      setKeyMessage({
        text: err.message || 'Invalid activation key.',
        isError: true,
      });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-[var(--foreground)] space-y-6 transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)] mb-1">
            Curriculum Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
            Electronics & Technology Courses
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-1 max-w-2xl">
            Syllabus-structured engineering courses with circuit schematics, virtual hardware labs, and mentor-evaluated tests.
          </p>
        </div>

        {/* Quick Activation Key Box */}
        <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs max-w-sm w-full shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)] mb-1.5">
            <Key className="w-3.5 h-3.5 text-[var(--muted-text)]" />
            <span>Course Activation Key</span>
          </div>
          <form onSubmit={handleRedeemKey} className="flex gap-2">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. INNO-ELEC-XXXX"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1.5 text-xs text-[var(--foreground)] uppercase font-mono placeholder:normal-case placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:bg-[var(--surface)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={redeeming || !keyInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-xs font-semibold text-[var(--background)] transition cursor-pointer"
            >
              {redeeming ? '...' : 'Redeem'}
            </button>
          </form>
          {keyMessage && (
            <p
              className={`text-[11px] mt-1.5 ${
                keyMessage.isError ? 'text-rose-500' : 'text-emerald-500 font-medium'
              }`}
            >
              {keyMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] font-semibold'
                  : 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--muted-text)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circuits, IoT, PCB..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 space-y-2 shadow-xs">
          <BookOpen className="w-8 h-8 text-[var(--muted-text)] mx-auto" />
          <h3 className="text-base font-semibold text-[var(--foreground)]">No courses match your filter</h3>
          <p className="text-xs text-[var(--muted-text)] max-w-md mx-auto">
            Try adjusting your search query or selecting a different category tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const enrolled = isEnrolled(course.id);
            const progress = getCourseProgress(course.id);
            const courseModules = modules.filter((m) => m.courseId === course.id);
            const courseLessons = lessons.filter((l) => l.courseId === course.id);

            return (
              <div
                key={course.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[var(--muted-text)] transition"
              >
                <div>
                  {/* Course Thumbnail */}
                  <div className="relative h-44 w-full overflow-hidden bg-[var(--surface-secondary)]">
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface)]/95 text-[var(--foreground)] border border-[var(--border)]">
                      {course.category}
                    </span>

                    {enrolled ? (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        ✓ Enrolled
                      </span>
                    ) : (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--foreground)] text-[var(--background)] font-mono">
                        ${course.price}
                      </span>
                    )}
                  </div>

                  {/* Course Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[var(--muted-text)] mt-1 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Mentor */}
                    <div className="flex items-center justify-between text-xs text-[var(--muted-text)] pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="opacity-70 text-[11px]">Mentor:</span>
                        <span className="font-semibold text-[var(--foreground)] truncate text-[11px]">
                          {course.mentorName}
                        </span>
                      </div>
                      <span className="text-[11px] opacity-75 shrink-0">
                        {courseModules.length} Modules • {courseLessons.length} Videos
                      </span>
                    </div>

                    {/* Progress Percentage Display */}
                    {enrolled ? (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--muted-text)] text-[11px]">Progress</span>
                          <span className="font-semibold text-[var(--foreground)] text-[11px]">
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--surface-secondary)] overflow-hidden border border-[var(--border)]">
                          <div
                            className="h-full bg-[var(--foreground)] rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-[var(--muted-text)] pt-1">
                        <span>Lifetime Access</span>
                        <span className="text-emerald-500 font-medium">Single One-Time Fee</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue Learning Button */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => onSelectCourse(course.id)}
                    className="w-full py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] shadow-xs"
                  >
                    {enrolled ? (
                      <>
                        <span>Continue Learning</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>View Curriculum & Enroll</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
