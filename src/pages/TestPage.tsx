import React, { useState, useEffect } from 'react';
import { useLMS } from '../context/LMSContext';
import { useAuth } from '../context/AuthContext';
import { Test, TestQuestion, TestAttempt } from '../types';
import {
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface TestPageProps {
  courseId: string;
  testId: string;
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onBack: () => void;
}

export const TestPage: React.FC<TestPageProps> = ({
  courseId,
  testId,
  onNavigateToCourse,
  onNavigateToLesson,
  onBack,
}) => {
  const { tests, lessons, submitTestAttempt, testAttempts } = useLMS();
  const { currentUser } = useAuth();

  const test = tests.find((t) => t.id === testId);
  const questions = test?.questions || [];

  // Previous attempt if any
  const previousAttempt = testAttempts
    .filter((a) => a.testId === testId && a.studentId === (currentUser?.uid || 'student-demo'))
    .pop();

  // Test Runner State
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeLeft, setTimeLeft] = useState((test?.durationMinutes || 15) * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState<TestAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<'stepper' | 'all'>('stepper');

  // Timer
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  if (!test) {
    return (
      <div className="py-20 text-center text-[var(--muted-text)]">
        <p>Test not found.</p>
        <button onClick={onBack} className="mt-4 text-[var(--foreground)] underline">
          Back
        </button>
      </div>
    );
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleTextAnswer = (questionId: string, value: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value.trim() }));
  };

  // Helper to check if a student answer matches the question's correct answer
  const isAnswerCorrect = (q: TestQuestion, userAns: any): boolean => {
    if (userAns === undefined || userAns === null || userAns === '') return false;

    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      const userIndex = Number(userAns);
      const selectedOptionText = !isNaN(userIndex) && q.options ? q.options[userIndex] : String(userAns);
      const correctRaw = String(q.correctAnswer ?? '').trim();

      // 1. Numeric index match
      if (!isNaN(Number(correctRaw)) && Number(correctRaw) === userIndex) {
        return true;
      }
      // 2. Exact or case-insensitive text match with selected option
      if (selectedOptionText && selectedOptionText.trim().toLowerCase() === correctRaw.toLowerCase()) {
        return true;
      }
      // 3. Direct userAns text match
      if (String(userAns).trim().toLowerCase() === correctRaw.toLowerCase()) {
        return true;
      }
      // 4. Letter index match ('A' -> 0, 'B' -> 1)
      if (/^[A-Za-z]$/.test(correctRaw)) {
        const correctIndexFromLetter = correctRaw.toUpperCase().charCodeAt(0) - 65;
        if (correctIndexFromLetter === userIndex) return true;
      }
      return false;
    }

    // Numerical, short answer, or fill in blank
    const cleanUser = String(userAns || '').toLowerCase().trim();
    const cleanCorrect = String(q.correctAnswer ?? '').toLowerCase().trim();
    return cleanUser === cleanCorrect;
  };

  const isOptionTheCorrectOne = (q: TestQuestion, oIdx: number): boolean => {
    const optText = q.options?.[oIdx] ?? '';
    const correctRaw = String(q.correctAnswer ?? '').trim();
    if (!isNaN(Number(correctRaw)) && Number(correctRaw) === oIdx) return true;
    if (optText.trim().toLowerCase() === correctRaw.toLowerCase()) return true;
    if (/^[A-Za-z]$/.test(correctRaw) && correctRaw.toUpperCase().charCodeAt(0) - 65 === oIdx) return true;
    return false;
  };

  const handleSubmitTest = async () => {
    if (isSubmitted || isSubmitting) return;
    setIsSubmitting(true);

    // Calculate score
    let totalScore = 0;
    questions.forEach((q) => {
      const userAns = answers[q.id];
      if (isAnswerCorrect(q, userAns)) {
        totalScore += 1;
      }
    });

    const maxScore = Math.max(1, questions.length);
    const percentage = Math.round((totalScore / maxScore) * 100);
    const passed = percentage >= test.passingScore;

    const studentUid = currentUser?.uid || 'student-demo';
    const studentName = currentUser?.displayName || 'Student Scholar';

    const result = await submitTestAttempt({
      testId: test.id,
      courseId: test.courseId,
      studentId: studentUid,
      studentName,
      score: totalScore,
      maxScore,
      percentage,
      passed,
      answers,
    });

    setCurrentAttempt(result);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-[var(--foreground)] transition-colors duration-200">
      {/* Top Test Header Card */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider block mb-1">
            Module Assessment
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">{test.title}</h1>
          <p className="text-xs text-[var(--muted-text)] mt-1">
            Passing Criteria: <strong className="text-emerald-500">{test.passingScore}%</strong> • Total Questions:{' '}
            {questions.length}
          </p>
        </div>

        {/* Timer Badge */}
        {!isSubmitted && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
            <Clock className={`w-4 h-4 ${timeLeft < 180 ? 'text-rose-500 animate-pulse' : 'text-[var(--muted-text)]'}`} />
            <span className={`font-mono text-sm font-bold ${timeLeft < 180 ? 'text-rose-500' : 'text-[var(--foreground)]'}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {/* RESULTS DISPLAY WHEN SUBMITTED */}
      {isSubmitted && currentAttempt && (
        <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs mb-6 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)]">
            {currentAttempt.passed ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : (
              <XCircle className="w-8 h-8 text-rose-500" />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Assessment Complete</h2>

          <div className="max-w-xs mx-auto p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
            <div className="text-3xl font-extrabold text-[var(--foreground)]">
              {currentAttempt.score} / {currentAttempt.maxScore}
            </div>
            <div
              className={`text-sm font-bold ${
                currentAttempt.passed ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {currentAttempt.percentage}% • {currentAttempt.passed ? '✓ Passed' : 'Needs Review (Failed)'}
            </div>
          </div>

          <p className="text-xs text-[var(--muted-text)] max-w-md mx-auto leading-relaxed">
            {currentAttempt.passed
              ? 'Congratulations! You have demonstrated mastery of this module and unlocked subsequent course stages.'
              : 'You did not meet the passing threshold. Review the lesson formulas and try again.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToCourse(courseId)}
              className="px-6 py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>Continue to Next Lesson / Module</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!currentAttempt.passed && (
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setCurrentAttempt(null);
                  setAnswers({});
                  setTimeLeft((test.durationMinutes || 15) * 60);
                }}
                className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--foreground)] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* QUESTION NAVIGATOR & PROGRESS BAR (When taking test) */}
      {!isSubmitted && questions.length > 0 && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--foreground)]">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-[var(--muted-text)]">•</span>
              <span className="text-[var(--muted-text)] font-mono">
                Answered: {Object.keys(answers).length} / {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDisplayMode('stepper')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition ${
                  displayMode === 'stepper'
                    ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold shadow-xs'
                    : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                }`}
              >
                Single Question Mode
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition ${
                  displayMode === 'all'
                    ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold shadow-xs'
                    : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                }`}
              >
                View All ({questions.length})
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{
                width: `${Math.round((Object.keys(answers).length / Math.max(1, questions.length)) * 100)}%`,
              }}
            />
          </div>

          {/* Question Number Palette */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--border)]">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = currentQuestionIndex === idx;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setCurrentQuestionIndex(idx);
                    if (displayMode === 'all') {
                      document.getElementById(`question-card-${q.id}`)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                      : 'bg-[var(--surface-secondary)] text-[var(--muted-text)] border border-[var(--border)] hover:text-[var(--foreground)]'
                  }`}
                  title={`Jump to Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* QUESTIONS DISPLAY */}
      <div className="space-y-4">
        {(isSubmitted || displayMode === 'all' ? questions : [questions[currentQuestionIndex]]).filter(Boolean).map((q, idx) => {
          const actualIndex = isSubmitted || displayMode === 'all' ? idx : currentQuestionIndex;
          const userAnswer = answers[q.id];
          const isCorrect = isSubmitted && isAnswerCorrect(q, userAnswer);

          return (
            <div
              key={q.id}
              id={`question-card-${q.id}`}
              className={`p-6 rounded-xl border bg-[var(--surface)] shadow-xs space-y-4 transition ${
                isSubmitted
                  ? isCorrect
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-rose-500/40 bg-rose-500/5'
                  : 'border-[var(--border)]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] font-bold text-xs flex items-center justify-center shrink-0">
                    {actualIndex + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)] leading-relaxed">{q.question}</h3>
                    <span className="text-[10px] text-[var(--muted-text)] capitalize mt-0.5 block">
                      Type: {q.type.replace('_', ' ')} • Marks: {q.points || 10} pts
                    </span>
                  </div>
                </div>

                {isSubmitted && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isCorrect
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                  </span>
                )}
              </div>

              {/* Multiple Choice / True-False Options */}
              {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = userAnswer === oIdx;
                    const isRightOption = isSubmitted && isOptionTheCorrectOne(q, oIdx);

                    return (
                      <button
                        key={oIdx}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        className={`p-3 rounded-lg border text-xs text-left transition flex items-center gap-2.5 cursor-pointer ${
                          isSubmitted
                            ? isRightOption
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium'
                              : isSelected
                              ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400'
                              : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--muted-text)]'
                            : isSelected
                            ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] font-medium shadow-xs'
                            : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)]'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isSelected
                              ? 'bg-[var(--background)] text-[var(--foreground)]'
                              : 'bg-[var(--surface-secondary)] text-[var(--muted-text)] border border-[var(--border)]'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Numerical or Fill in the blank inputs */}
              {(q.type === 'numerical' || q.type === 'fill_in_blank' || q.type === 'short_answer') && (
                <div className="pt-1">
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={String(userAnswer || '')}
                    onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                    placeholder={q.type === 'numerical' ? 'Enter exact numerical value...' : 'Type answer here...'}
                    className="w-full sm:w-80 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted-text)] focus:border-[var(--foreground)] focus:outline-none"
                  />
                  {isSubmitted && !isCorrect && (
                    <div className="text-xs text-emerald-500 font-medium mt-2">
                      Correct Answer: <strong>{String(q.correctAnswer)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation when submitted */}
              {isSubmitted && q.explanation && (
                <div className="p-3.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)] space-y-1">
                  <span className="font-bold block text-[11px]">Explanation:</span>
                  <p className="text-[var(--muted-text)]">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons (Stepper mode) */}
      {!isSubmitted && displayMode === 'stepper' && questions.length > 1 && (
        <div className="flex items-center justify-between gap-3 pt-4">
          <button
            type="button"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] disabled:opacity-40 text-xs font-semibold cursor-pointer transition shadow-xs"
          >
            ← Previous Question
          </button>

          <span className="text-xs text-[var(--muted-text)] font-mono">
            {currentQuestionIndex + 1} / {questions.length}
          </span>

          <button
            type="button"
            disabled={currentQuestionIndex >= questions.length - 1}
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] disabled:opacity-40 text-xs font-semibold cursor-pointer transition shadow-xs"
          >
            Next Question →
          </button>
        </div>
      )}

      {/* Bottom Submit Action Bar */}
      {!isSubmitted && (
        <div className="mt-8 p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4">
          <div className="text-xs text-[var(--muted-text)]">
            Answered: <strong className="text-[var(--foreground)]">{Object.keys(answers).length}</strong> of {questions.length} questions
          </div>

          <button
            onClick={handleSubmitTest}
            disabled={isSubmitting || Object.keys(answers).length === 0}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-[var(--background)] text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Evaluating Answers...' : `Submit Assessment (${Object.keys(answers).length}/${questions.length})`}
          </button>
        </div>
      )}
    </div>
  );
};
