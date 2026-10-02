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
      <div className="py-20 text-center text-slate-400">
        <p>Test not found.</p>
        <button onClick={onBack} className="mt-4 text-cyan-400 underline">
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
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-slate-100">
      {/* Top Test Header Card */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
            Module Assessment
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{test.title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Passing Criteria: <strong className="text-emerald-400">{test.passingScore}%</strong> • Total Questions:{' '}
            {questions.length}
          </p>
        </div>

        {/* Timer Badge */}
        {!isSubmitted && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950 border border-slate-700/80">
            <Clock className={`w-4 h-4 ${timeLeft < 180 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className={`font-mono text-base font-bold ${timeLeft < 180 ? 'text-rose-400' : 'text-white'}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {/* RESULTS DISPLAY WHEN SUBMITTED */}
      {isSubmitted && currentAttempt && (
        <div className="p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl mb-8 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-slate-900 border border-slate-800">
            {currentAttempt.passed ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            ) : (
              <XCircle className="w-10 h-10 text-rose-400" />
            )}
          </div>

          <h2 className="text-2xl font-extrabold text-white">Assessment Complete</h2>

          <div className="max-w-xs mx-auto p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="text-3xl font-extrabold text-white">
              {currentAttempt.score} / {currentAttempt.maxScore}
            </div>
            <div
              className={`text-sm font-bold ${
                currentAttempt.passed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentAttempt.percentage}% • {currentAttempt.passed ? '✓ Passed' : 'Needs Review (Failed)'}
            </div>
          </div>

          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {currentAttempt.passed
              ? 'Congratulations! You have demonstrated mastery of this module and unlocked subsequent course stages.'
              : 'You did not meet the passing threshold. Review the lesson formulas and try again.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToCourse(courseId)}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
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
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* QUESTIONS LIST */}
      <div className="space-y-6">
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
              className={`p-6 rounded-3xl border bg-slate-900/60 space-y-4 transition ${
                isSubmitted
                  ? isCorrect
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-rose-500/40 bg-rose-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white leading-relaxed">{q.question}</h3>
                    <span className="text-[10px] text-slate-400 capitalize mt-0.5 block">
                      Type: {q.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {isSubmitted && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isCorrect
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                  </span>
                )}
              </div>

              {/* Multiple Choice / True-False Options */}
              {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = userAnswer === oIdx;
                    const isRightOption = isSubmitted && Number(q.correctAnswer) === oIdx;

                    return (
                      <button
                        key={oIdx}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        className={`p-3 rounded-2xl border text-xs text-left transition flex items-center gap-3 cursor-pointer ${
                          isSubmitted
                            ? isRightOption
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                              : isSelected
                              ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400'
                            : isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
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
                <div className="pt-2">
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={String(userAnswer || '')}
                    onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                    placeholder={q.type === 'numerical' ? 'Enter exact numerical value...' : 'Type answer here...'}
                    className="w-full sm:w-80 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                  {isSubmitted && !isCorrect && (
                    <div className="text-xs text-emerald-400 mt-2">
                      Correct Answer: <strong>{String(q.correctAnswer)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation when submitted */}
              {isSubmitted && q.explanation && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="text-cyan-400 font-bold block text-[11px]">Explanation:</span>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Submit Action Bar */}
      {!isSubmitted && (
        <div className="mt-8 p-6 rounded-3xl border border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-2xl backdrop-blur-md">
          <div className="text-xs text-slate-400">
            Answered: <strong>{Object.keys(answers).length}</strong> of {questions.length} questions
          </div>

          <button
            onClick={handleSubmitTest}
            disabled={isSubmitting || Object.keys(answers).length === 0}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Evaluating Answers...' : 'Submit Assessment'}
          </button>
        </div>
      )}
    </div>
  );
};
