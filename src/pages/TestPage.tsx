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

  const handleSubmitTest = async () => {
    if (isSubmitted || isSubmitting) return;
    setIsSubmitting(true);

    // Calculate score
    let totalScore = 0;
    questions.forEach((q) => {
      const userAns = answers[q.id];
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (Number(userAns) === Number(q.correctAnswer)) {
          totalScore += 1;
        }
      } else if (q.type === 'numerical' || q.type === 'fill_in_blank') {
        const cleanUser = String(userAns || '').toLowerCase().trim();
        const cleanCorrect = String(q.correctAnswer).toLowerCase().trim();
        if (cleanUser === cleanCorrect) {
          totalScore += 1;
        }
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

      {/* QUESTIONS LIST */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isCorrect =
            isSubmitted &&
            ((q.type === 'multiple_choice' || q.type === 'true_false')
              ? Number(userAnswer) === Number(q.correctAnswer)
              : String(userAnswer || '').toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim());

          return (
            <div
              key={q.id}
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
                  <span className="w-6 h-6 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)] leading-relaxed">{q.question}</h3>
                    <span className="text-[10px] text-[var(--muted-text)] capitalize mt-0.5 block">
                      Type: {q.type.replace('_', ' ')}
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
                    const isRightOption = isSubmitted && Number(q.correctAnswer) === oIdx;

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
              {(q.type === 'numerical' || q.type === 'fill_in_blank') && (
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
            {isSubmitting ? 'Evaluating Answers...' : 'Submit Assessment'}
          </button>
        </div>
      )}
    </div>
  );
};
