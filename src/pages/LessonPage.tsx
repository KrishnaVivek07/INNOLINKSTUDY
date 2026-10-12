import React, { useState, useEffect, useRef } from 'react';
import { useLMS } from '../context/LMSContext';
import { useAuth } from '../context/AuthContext';
import { Lesson, AISummary } from '../types';
import { resolveVideoUrl, getYouTubeEmbedUrl, getGoogleDriveEmbedUrl } from '../lib/videoStorage';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  FileCheck,
  Send,
  Loader2,
  Lock,
  Download,
  AlertCircle,
  Award,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronRight,
  Cpu,
} from 'lucide-react';

interface LessonPageProps {
  courseId: string;
  lessonId: string;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onNavigateToTest?: (courseId: string, testId: string) => void;
  onBack: () => void;
  onNavigateToLab?: () => void;
}

export const LessonPage: React.FC<LessonPageProps> = ({
  courseId,
  lessonId,
  onNavigateToLesson,
  onNavigateToTest,
  onBack,
  onNavigateToLab,
}) => {
  const {
    courses,
    modules,
    lessons,
    aiSummaries,
    getCourseProgress,
    markLessonComplete,
    recordWatchPercentage,
    assignments,
    submissions,
    submitAssignment,
    tests,
  } = useLMS();
  const { currentUser } = useAuth();

  const course = courses.find((c) => c.id === courseId) || courses[0];
  const courseModules = course ? modules.filter((m) => m.courseId === course.id).sort((a, b) => a.order - b.order) : [];
  const courseLessons = course ? lessons.filter((l) => l.courseId === course.id).sort((a, b) => a.order - b.order) : [];
  const lesson = lessons.find((l) => l.id === lessonId) || courseLessons[0];
  const currentIndex = courseLessons.findIndex((l) => l.id === lesson?.id);
  const nextLesson = currentIndex >= 0 && currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

  const currentSummary = lesson ? aiSummaries.find((s) => s.lessonId === lesson.id) : null;
  const progress = course ? getCourseProgress(course.id) : null;
  const isCompleted = lesson && progress ? progress.completedLessons.includes(lesson.id) : false;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'interactive_lab' | 'summary' | 'transcript' | 'notes' | 'ask_ai' | 'assignment'>('overview');

  // Interactive Electronics Lab State (Byju's-inspired active inquiry)
  const [interactiveVoltage, setInteractiveVoltage] = useState<number>(5.0);
  const [interactiveResistance, setInteractiveResistance] = useState<number>(220);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizRevealed, setQuizRevealed] = useState<boolean>(false);

  // Real Video Player State & Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lesson?.videoDuration || 600);
  const [watchedPercent, setWatchedPercent] = useState(isCompleted ? 100 : 0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Embed helpers
  const ytEmbedUrl = lesson?.videoUrl ? getYouTubeEmbedUrl(lesson.videoUrl) : null;
  const driveEmbedUrl = lesson?.videoUrl ? getGoogleDriveEmbedUrl(lesson.videoUrl) : null;

  // Resolve video URL from storage / IndexedDB when lesson changes
  useEffect(() => {
    let isCurrent = true;
    setVideoLoadError(null);
    setIsPlaying(false);
    setCurrentTime(0);

    if (lesson?.videoUrl) {
      resolveVideoUrl(lesson.videoUrl).then((url) => {
        if (isCurrent) {
          setResolvedVideoUrl(url);
        }
      }).catch((err) => {
        console.warn('Failed resolving video URL:', err);
        if (isCurrent) setVideoLoadError('Could not load video source.');
      });
    } else {
      setResolvedVideoUrl('');
    }

    return () => {
      isCurrent = false;
    };
  }, [lesson?.id, lesson?.videoUrl]);

  // Expand the active module in sidebar by default
  useEffect(() => {
    if (lesson?.moduleId) {
      setExpandedModules((prev) => ({ ...prev, [lesson.moduleId]: true }));
    }
  }, [lesson?.moduleId]);

  // Toggle Play / Pause on HTML5 video element
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Video playback notice:', err);
          setIsPlaying(false);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (newPercent: number) => {
    const targetTime = Math.max(0, Math.min(duration, newPercent * duration));
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    if (videoRef.current) {
      videoRef.current.playbackRate = next;
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((e) => console.warn(e));
    } else {
      document.exitFullscreen().catch((e) => console.warn(e));
    }
  };

  // Gemini "Ask AI About This Lesson" State
  const [questionInput, setQuestionInput] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{ sender: 'user' | 'gemini'; text: string }[]>([
    {
      sender: 'gemini',
      text: `Hello! I am your InnoLink AI engineering tutor for "${lesson?.title || 'this lesson'}". Ask me anything regarding the formulas, schematics, or operational physics!`,
    },
  ]);
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Practical Assignment Form State
  const lessonAssignment = assignments.find((a) => a.lessonId === lessonId || a.courseId === courseId);
  const existingSubmission = lessonAssignment
    ? submissions.find((s) => s.assignmentId === lessonAssignment.id && s.studentId === (currentUser?.uid || 'student-demo'))
    : null;
  const [assignmentText, setAssignmentText] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Check if there is a module test after this lesson
  const relatedTest = tests.find((t) => t.lessonId === lessonId || t.moduleId === lesson?.moduleId);

  if (!lesson || !course) {
    return (
      <div className="py-20 text-center text-[var(--muted-text)]">
        <p>Lesson not found.</p>
        <button onClick={onBack} className="mt-4 text-cyan-400 underline">
          Back to Course
        </button>
      </div>
    );
  }

  const handleAskGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || isAskingAi) return;

    const userQ = questionInput.trim();
    setQuestionInput('');
    setAiChatHistory((prev) => [...prev, { sender: 'user', text: userQ }]);
    setIsAskingAi(true);

    try {
      const res = await fetch('/api/gemini/ask-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQ,
          lessonTitle: lesson.title,
          lessonDescription: lesson.description,
          summary: currentSummary?.summary || '',
          courseTitle: course.title,
        }),
      });

      const data = await res.json();
      setAiChatHistory((prev) => [
        ...prev,
        { sender: 'gemini', text: data.answer || 'Thank you for your question.' },
      ]);
    } catch (err) {
      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: 'AI assistant is currently optimizing. In electronics, verify Ohm’s law V = IR and boundary conditions for this stage.',
        },
      ]);
    } finally {
      setIsAskingAi(false);
    }
  };

  const handleSubmitAssignmentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentText.trim() || !lessonAssignment) return;
    setSubmittingAssignment(true);
    try {
      await submitAssignment(lessonAssignment.id, course.id, assignmentText, 'text');
      setAssignmentText('');
    } catch (e) {
      // Error
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!course || !lesson) {
    return (
      <div className="py-24 text-center text-[var(--muted-text)] space-y-3">
        <p className="text-sm font-semibold text-white">No video lessons available in this module yet.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-[var(--foreground)] transition-colors duration-200">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--border)] text-xs">
        <div className="flex items-center gap-2 text-[var(--muted-text)]">
          <button onClick={onBack} className="hover:text-[var(--foreground)] transition font-medium">
            {course.title}
          </button>
          <span>/</span>
          <span className="text-[var(--foreground)] font-semibold">{lesson.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[var(--muted-text)]">
            Watch Progress: <strong className="text-[var(--foreground)]">{watchedPercent}%</strong>
          </span>
          {isCompleted && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Lesson Completed</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Video Player + Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Video Player Container */}
          <div
            ref={playerContainerRef}
            className="rounded-2xl border border-[var(--border)] bg-slate-950 overflow-hidden shadow-sm relative group"
          >
            {/* Player Viewport */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              {ytEmbedUrl ? (
                <iframe
                  src={ytEmbedUrl}
                  title={lesson.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : driveEmbedUrl ? (
                <iframe
                  src={driveEmbedUrl}
                  title={lesson.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : resolvedVideoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={resolvedVideoUrl}
                    className="w-full h-full object-contain bg-black cursor-pointer"
                    playsInline
                    onClick={togglePlay}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={() => {
                      if (!videoRef.current) return;
                      const ct = videoRef.current.currentTime;
                      setCurrentTime(ct);
                      const dur = videoRef.current.duration || duration;
                      const pct = Math.min(100, Math.round((ct / dur) * 100));
                      setWatchedPercent((p) => Math.max(p, pct));
                      if (pct >= 85) {
                        recordWatchPercentage(course.id, lesson.id, pct);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration)) {
                        setDuration(Math.floor(videoRef.current.duration));
                      }
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      markLessonComplete(course.id, lesson.id);
                    }}
                    onError={() => {
                      setVideoLoadError('Unable to decode video. Check video file format.');
                    }}
                  />

                  {/* Big Play Overlay Button when paused */}
                  {!isPlaying && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[var(--foreground)] hover:bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center shadow-lg hover:scale-105 transition cursor-pointer z-10"
                    >
                      <Play className="w-7 h-7 ml-1 fill-white" />
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center p-6 text-[var(--muted-text)]">
                  <Play className="w-12 h-12 mx-auto text-[var(--muted-text)] mb-2" />
                  <p className="text-xs font-semibold text-slate-300">No video stream available for this lesson.</p>
                  <p className="text-[11px] text-[var(--muted-text)] mt-1">Please upload a video in the Mentor Portal.</p>
                </div>
              )}

              {/* Watermark */}
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded bg-black/70 text-[11px] font-mono text-white/90 border border-white/10 pointer-events-none z-10">
                InnoLink Tech • HD
              </div>

              {videoLoadError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
                  <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                  <p className="text-sm font-semibold text-white">{videoLoadError}</p>
                  <p className="text-xs text-[var(--muted-text)] mt-1 max-w-sm">
                    The video format might not be supported directly by your browser or the file URL is unavailable.
                  </p>
                </div>
              )}
            </div>

            {/* Custom Bottom Video Controls Bar for HTML5 video */}
            {!ytEmbedUrl && !driveEmbedUrl && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-3 text-xs text-white">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="font-mono text-slate-300 shrink-0 text-[11px]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Scrubber Bar */}
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
                    handleSeek(newPercent);
                  }}
                  className="flex-1 h-2 rounded-full bg-slate-800 cursor-pointer overflow-hidden relative"
                >
                  <div
                    className="h-full bg-slate-200 rounded-full"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Playback speed toggle */}
                <button
                  onClick={cycleSpeed}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-semibold text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>

                {/* Fullscreen button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => markLessonComplete(course.id, lesson.id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition cursor-pointer text-[11px] flex items-center gap-1 shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark Done</span>
                </button>
              </div>
            )}
          </div>

          {/* Lesson Title & Quick Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">{lesson.title}</h1>
              <p className="text-xs text-[var(--muted-text)] mt-1">
                {course.title} • {courseModules.find((m) => m.id === lesson.moduleId)?.title || `Module ${lesson.moduleId}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {relatedTest && (
                <button
                  onClick={() => onNavigateToTest && onNavigateToTest(course.id, relatedTest.id)}
                  className="px-3.5 py-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  <span>Module Test</span>
                </button>
              )}

              {nextLesson && (
                <button
                  onClick={() => onNavigateToLesson(course.id, nextLesson.id)}
                  className="px-4 py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Next Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* TABS: Overview | AI Summary | Key Concepts | Ask AI | Resources | Test / Assignment */}
          <div className="border-b border-[var(--border)] flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('interactive_lab')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition cursor-pointer ${
                activeTab === 'interactive_lab'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Circuit & Practice</span>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Summary</span>
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition cursor-pointer ${
                activeTab === 'transcript'
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              Key Concepts & Formulas
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              Resources & Notes
            </button>
            <button
              onClick={() => setActiveTab('ask_ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition cursor-pointer ${
                activeTab === 'ask_ai'
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ask AI Tutor</span>
            </button>
            <button
              onClick={() => setActiveTab('assignment')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition cursor-pointer ${
                activeTab === 'assignment'
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Test / Assignment</span>
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs min-h-[260px]">
            {/* 0. INTERACTIVE CIRCUIT SIMULATION & BYJU'S-STYLE PREDICTION PRACTICE */}
            {activeTab === 'interactive_lab' && (
              <div className="space-y-6">
                {/* 1. Header with Learning Objective */}
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Learning Objective & Concept Inquiry</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--foreground)] font-medium leading-relaxed">
                    Explore Ohm's Law and current limiting in electronics. Adjust circuit parameters in real-time, predict behavior, and verify with electrical equations before wiring on a physical breadboard.
                  </p>
                </div>

                {/* 2. Interactive Virtual Circuit Diagram & Simulator */}
                <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-cyan-500" />
                      <span>Live DC Circuit Analyzer (Ohm's Law: V = I × R)</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]">
                      Forward Diode Drop: 2.00 V (Fixed)
                    </span>
                  </div>

                  {/* Interactive Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Voltage Slider */}
                    <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--foreground)]">Supply Voltage (V):</span>
                        <span className="font-mono font-bold text-cyan-500">{interactiveVoltage.toFixed(1)} V</span>
                      </div>
                      <input
                        type="range"
                        min="2.5"
                        max="12.0"
                        step="0.5"
                        value={interactiveVoltage}
                        onChange={(e) => setInteractiveVoltage(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[var(--muted-text)] font-mono">
                        <span>2.5V (3xAA)</span>
                        <span>5.0V (USB/Uno)</span>
                        <span>12.0V (VIN)</span>
                      </div>
                    </div>

                    {/* Resistance Slider */}
                    <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--foreground)]">Current-Limiting Resistor:</span>
                        <span className="font-mono font-bold text-amber-500">{interactiveResistance} Ω</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="2200"
                        step="50"
                        value={interactiveResistance}
                        onChange={(e) => setInteractiveResistance(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[var(--muted-text)] font-mono">
                        <span>100Ω (Low)</span>
                        <span>220Ω (Standard)</span>
                        <span>2.2kΩ (High)</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Calculations & Visual State */}
                  {(() => {
                    const effectiveV = Math.max(0, interactiveVoltage - 2.0);
                    const currentMa = (effectiveV / interactiveResistance) * 1000;
                    const powerMw = currentMa * interactiveVoltage;
                    const isSafe = currentMa >= 5 && currentMa <= 20;
                    const isOver = currentMa > 20;

                    return (
                      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        {/* LED Visual State */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              isOver
                                ? 'bg-rose-500/90 border-rose-400 shadow-lg shadow-rose-500/50 animate-pulse'
                                : currentMa > 0
                                ? 'bg-emerald-500/80 border-emerald-400 shadow-md shadow-emerald-500/30'
                                : 'bg-slate-700/50 border-slate-600'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-white uppercase">LED</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-[var(--foreground)]">LED Status</span>
                            <span
                              className={`text-[11px] font-medium ${
                                isOver
                                  ? 'text-rose-500 font-semibold'
                                  : isSafe
                                  ? 'text-emerald-500 font-semibold'
                                  : 'text-amber-500'
                              }`}
                            >
                              {isOver
                                ? '⚠ DANGER: Overcurrent (>20mA)'
                                : isSafe
                                ? '✓ Optimal Safe Operation'
                                : 'Dim (Underdriven)'}
                            </span>
                          </div>
                        </div>

                        {/* Calculated Metrics */}
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-text)]">Loop Current:</span>
                            <span className="font-mono font-bold text-[var(--foreground)]">{currentMa.toFixed(2)} mA</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-text)]">Resistor Drop:</span>
                            <span className="font-mono text-[var(--foreground)]">{effectiveV.toFixed(2)} V</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-text)]">Total Power:</span>
                            <span className="font-mono text-[var(--foreground)]">{powerMw.toFixed(1)} mW</span>
                          </div>
                        </div>

                        {/* Equation Box */}
                        <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] font-mono leading-relaxed text-[var(--muted-text)]">
                          <div>I = (V_sup - V_led) / R</div>
                          <div className="text-[var(--foreground)] font-semibold">
                            I = ({interactiveVoltage.toFixed(1)} - 2.0) / {interactiveResistance} = {(currentMa / 1000).toFixed(4)} A
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Checkpoint Prediction Challenge */}
                <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>Concept Prediction Checkpoint</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--foreground)] font-medium">
                    Question: If you increase the circuit resistor from 220Ω to 1000Ω while maintaining supply voltage at 5V, what will occur?
                  </p>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {[
                      {
                        idx: 0,
                        text: 'A) Current increases to 50mA and the LED burns out immediately.',
                        correct: false,
                        explanation: 'Incorrect. By Ohm’s Law (I = V / R), increasing resistance decreases current, not increases.',
                      },
                      {
                        idx: 1,
                        text: 'B) Current decreases from ~13.6mA to ~3.0mA, causing the LED to dim safely.',
                        correct: true,
                        explanation: 'Correct! (5V - 2V) / 1000Ω = 3mA. Because resistance increased by ~4.5x, current drops proportionally and the LED glows dimmer.',
                      },
                      {
                        idx: 2,
                        text: 'C) The forward voltage drop across the diode rises to 5V to compensate.',
                        correct: false,
                        explanation: 'Incorrect. A standard LED maintains its characteristic bandgap forward drop (~2.0V) when forward biased.',
                      },
                      {
                        idx: 3,
                        text: 'D) Total loop current remains constant because diodes are non-linear.',
                        correct: false,
                        explanation: 'Incorrect. The series current-limiting resistor strictly dictates the allowable current according to Ohm’s Law.',
                      },
                    ].map((opt) => {
                      const isSelected = quizSelectedOption === opt.idx;
                      return (
                        <button
                          key={opt.idx}
                          type="button"
                          onClick={() => {
                            setQuizSelectedOption(opt.idx);
                            setQuizRevealed(true);
                          }}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition cursor-pointer flex flex-col gap-1 ${
                            isSelected
                              ? opt.correct
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                                : 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                              : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{opt.text}</span>
                            {quizRevealed && isSelected && (
                              <span className="text-[11px] font-bold">
                                {opt.correct ? '✓ Correct' : '✕ Try Again'}
                              </span>
                            )}
                          </div>
                          {quizRevealed && isSelected && (
                            <p className="text-[11px] mt-1 text-[var(--muted-text)] font-normal leading-relaxed">
                              {opt.explanation}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Action: Open in Virtual Hardware Coding Lab */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[var(--foreground)] block">Ready for Hands-On Practice?</span>
                    <span className="text-[11px] text-[var(--muted-text)]">
                      Wire this circuit on our virtual breadboard with Arduino Uno, ESP32, or Raspberry Pi Pico.
                    </span>
                  </div>

                  {onNavigateToLab && (
                    <button
                      type="button"
                      onClick={onNavigateToLab}
                      className="px-4 py-2 rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Open Virtual Hardware Lab</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 1. OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Lesson Description</h3>
                <p className="text-xs sm:text-sm text-[var(--muted-text)] leading-relaxed">
                  {lesson.description}
                </p>

                {lesson.resources && lesson.resources.length > 0 && (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <h4 className="text-xs font-bold text-[var(--foreground)] mb-2 uppercase tracking-wider">
                      Downloadable Resources & Schematics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {lesson.resources.map((res, idx) => (
                        <a
                          key={idx}
                          href={res.url}
                          onClick={(e) => e.preventDefault()}
                          className="px-3 py-1.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-[var(--muted-text)]" />
                          <span>{res.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. AI SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--foreground)]" />
                    <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                      Faculty-Reviewed AI Summary
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] font-medium">
                    Status: {currentSummary?.status === 'published' ? 'Faculty Approved' : 'Draft'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--muted-text)] leading-relaxed">
                  {currentSummary?.summary || 'AI Summary is currently being processed for this lesson.'}
                </p>

                {/* Key Concepts */}
                {currentSummary?.keyConcepts && currentSummary.keyConcepts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                      Key Concepts
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentSummary.keyConcepts.map((concept, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)] flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{concept}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Important Points */}
                {currentSummary?.importantPoints && currentSummary.importantPoints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                      Crucial Examination & Lab Points
                    </h4>
                    <div className="space-y-1.5">
                      {currentSummary.importantPoints.map((pt, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)] flex items-start gap-2"
                        >
                          <span className="text-[var(--foreground)] font-bold">•</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. TRANSCRIPT & FORMULAS */}
            {activeTab === 'transcript' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                  Lesson Formulas & Technical Transcript
                </h3>
                <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] font-mono text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                  {lesson.notes || 'Mathematical derivations and schematic netlists for this lesson are provided above.'}
                </div>
              </div>
            )}

            {/* 4. NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Study Notes</h3>
                <p className="text-xs sm:text-sm text-[var(--muted-text)] leading-relaxed whitespace-pre-line">
                  {lesson.notes || 'No custom notes provided for this lesson.'}
                </p>
              </div>
            )}

            {/* 5. ASK AI (GEMINI CONTEXT-AWARE ASSISTANT) */}
            {activeTab === 'ask_ai' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--foreground)]" />
                    <span className="text-xs font-bold text-[var(--foreground)]">Ask Gemini About This Lesson</span>
                  </div>
                  <span className="text-[10px] text-[var(--muted-text)] font-mono">Model: Gemini 3.8 Flash</span>
                </div>

                {/* Chat Stream Window */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {aiChatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] ml-8'
                          : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] mr-8 shadow-xs'
                      }`}
                    >
                      <span className="block text-[10px] font-bold text-[var(--muted-text)] mb-1">
                        {msg.sender === 'user' ? 'You' : 'InnoLink Gemini Tutor'}
                      </span>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                  {isAskingAi && (
                    <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--muted-text)] flex items-center gap-2 mr-8">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--foreground)]" />
                      <span>Gemini is analyzing lesson context and preparing explanation...</span>
                    </div>
                  )}
                </div>

                {/* Question Input Form */}
                <form onSubmit={handleAskGemini} className="flex gap-2 pt-2 border-t border-[var(--border)]">
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="e.g. Why does collector current change? Explain this simply."
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] placeholder-slate-400 focus:border-slate-800 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAskingAi || !questionInput.trim()}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Ask Gemini</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* 6. PRACTICAL ASSIGNMENT TAB */}
            {activeTab === 'assignment' && (
              <div className="space-y-4">
                {lessonAssignment ? (
                  <>
                    <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-[var(--foreground)]">{lessonAssignment.title}</h4>
                        <span className="text-xs font-bold text-[var(--foreground)]">
                          Max Marks: {lessonAssignment.maxMarks}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted-text)] whitespace-pre-line leading-relaxed">
                        {lessonAssignment.description}
                      </p>
                    </div>

                    {existingSubmission ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[var(--foreground)] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Submitted on {new Date(existingSubmission.submittedAt).toLocaleDateString()}</span>
                          </span>
                          <span className="font-bold text-[var(--foreground)]">
                            {existingSubmission.status === 'reviewed'
                              ? `Score: ${existingSubmission.marks}/${lessonAssignment.maxMarks}`
                              : 'Pending Mentor Review'}
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] font-mono text-[11px]">
                          {existingSubmission.content}
                        </div>

                        {existingSubmission.feedback && (
                          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                            <span className="text-[var(--foreground)] font-bold block mb-1">Mentor Feedback:</span>
                            <p className="text-[var(--muted-text)]">{existingSubmission.feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitAssignmentForm} className="space-y-3">
                        <label className="block text-xs font-semibold text-[var(--foreground)]">
                          Submit Your Solution (Schematic Details, Calculations, or Circuit Explanation)
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={assignmentText}
                          onChange={(e) => setAssignmentText(e.target.value)}
                          placeholder="Detail your component selections, bridge rectifier ripple calculations, and breadboard testing results..."
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--foreground)] placeholder-slate-400 focus:border-slate-800 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={submittingAssignment || !assignmentText.trim()}
                          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
                        >
                          {submittingAssignment ? 'Submitting...' : 'Submit for Mentor Review'}
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-[var(--muted-text)] py-6 text-center">
                    No assignment assigned to this individual lesson.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Course Outline & Lessons List grouped by module */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs sticky top-24">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Course Curriculum</h3>
              <span className="text-[11px] font-mono text-[var(--muted-text)] font-semibold">
                {courseModules.length} Modules • {courseLessons.length} Videos
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted-text)] mb-4">Sequential module video lectures</p>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {courseModules.map((mod, modIdx) => {
                const modLessons = courseLessons.filter((l) => l.moduleId === mod.id);
                const isExpanded = expandedModules[mod.id] !== false; // default open
                const completedInMod = modLessons.filter((l) => progress?.completedLessons.includes(l.id)).length;

                return (
                  <div key={mod.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/60 overflow-hidden">
                    <button
                      onClick={() => setExpandedModules((prev) => ({ ...prev, [mod.id]: !isExpanded }))}
                      className="w-full px-3.5 py-2.5 bg-[var(--surface-secondary)] hover:opacity-80 transition flex items-center justify-between text-left text-xs font-bold text-[var(--foreground)] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[var(--muted-text)]" />
                        <span>Module {modIdx + 1}: {mod.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--muted-text)]">
                        <span>{completedInMod}/{modLessons.length}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-2 space-y-1.5 border-t border-[var(--border)]">
                        {modLessons.length === 0 ? (
                          <div className="p-2 text-[11px] text-[var(--muted-text)] italic">No videos in this module yet</div>
                        ) : (
                          modLessons.map((l, vIdx) => {
                            const isSelected = l.id === lessonId;
                            const isLessonDone = progress?.completedLessons.includes(l.id);

                            return (
                              <button
                                key={l.id}
                                onClick={() => onNavigateToLesson(course.id, l.id)}
                                className={`w-full p-2.5 rounded-lg border text-left transition flex items-start gap-2.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-[var(--surface)] border-[var(--foreground)] text-[var(--foreground)] shadow-xs font-semibold'
                                    : 'bg-[var(--surface)]/80 border-transparent hover:bg-[var(--surface)] text-[var(--foreground)]'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                    isLessonDone
                                      ? 'bg-emerald-500/20 text-emerald-500'
                                      : isSelected
                                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                                      : 'bg-[var(--surface-secondary)] text-[var(--muted-text)]'
                                  }`}
                                >
                                  {isLessonDone ? '✓' : vIdx + 1}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium truncate text-[var(--foreground)]">
                                    Video {vIdx + 1}: {l.title}
                                  </div>
                                  <div className="text-[10px] text-[var(--muted-text)] mt-0.5 flex items-center gap-2">
                                    <span>{Math.round((l.videoDuration || 600) / 60)}m</span>
                                    {isLessonDone && <span className="text-emerald-500 font-semibold">Done</span>}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
