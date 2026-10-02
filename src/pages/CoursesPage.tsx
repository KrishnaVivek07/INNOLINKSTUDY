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
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CoursesPageProps {
  onSelectCourse: (courseId: string) => void;
  openAuthModal: (mode: 'student_login' | 'mentor_login' | 'register') => void;
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
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-100 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            Curriculum Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Electronics & Technology Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Industry-calibrated courses with hands-on lab projects, video lectures, AI tutoring, and mentor assessments.
          </p>
        </div>

        {/* Quick Activation Key Box */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 max-w-sm w-full shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Course Activation Key</span>
          </div>
          <form onSubmit={handleRedeemKey} className="flex gap-2">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. INNO-ELEC-XXXX"
              className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-cyan-300 uppercase font-mono placeholder:normal-case placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={redeeming || !keyInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-semibold text-white transition cursor-pointer"
            >
              {redeeming ? '...' : 'Redeem'}
            </button>
          </form>
          {keyMessage && (
            <p
              className={`text-[11px] mt-1.5 ${
                keyMessage.isError ? 'text-rose-400' : 'text-emerald-400'
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
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circuits, IoT, PCB..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/70 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/40 p-8 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No courses published yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Mentors can build and publish complete multi-module engineering video curriculums in the Course Builder.
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
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition shadow-sm"
              >
                <div>
                  {/* Course Thumbnail */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950/80 text-cyan-300 border border-slate-700">
                      {course.category}
                    </span>

                    {enrolled ? (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                        ✓ Enrolled
                      </span>
                    ) : (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950/80 text-white border border-slate-700 font-mono">
                        ${course.price}
                      </span>
                    )}
                  </div>

                  {/* Course Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      {/* Course Title */}
                      <h3 className="text-sm font-bold text-white line-clamp-1">
                        {course.title}
                      </h3>
                      {/* Short Description */}
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Mentor */}
                    <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-500 text-[11px]">Mentor:</span>
                        <span className="font-semibold text-cyan-400 truncate text-[11px]">
                          {course.mentorName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {courseModules.length} Modules • {courseLessons.length} Videos
                      </span>
                    </div>

                    {/* Progress Percentage Display */}
                    {enrolled ? (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">Progress</span>
                          <span className="font-semibold text-cyan-400 text-[11px]">
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Lifetime Access</span>
                        <span className="text-emerald-400 font-medium">Single One-Time Fee</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue Learning Button */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => onSelectCourse(course.id)}
                    className={`w-full py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      enrolled
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
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
