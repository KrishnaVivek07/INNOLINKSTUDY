import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { Submission, Assignment } from '../types';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Award,
  ArrowRight,
  Send,
} from 'lucide-react';

interface MentorAssignmentsPageProps {
  onBack: () => void;
}

export const MentorAssignmentsPage: React.FC<MentorAssignmentsPageProps> = ({ onBack }) => {
  const { assignments, submissions, gradeSubmission, triggerCelebrationConfetti } = useLMS();

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    submissions[0]?.id || null
  );
  const [marksInput, setMarksInput] = useState<number>(18);
  const [feedbackInput, setFeedbackInput] = useState<string>(
    'Excellent circuit design. Improve the explanation of ripple factor in inductive filters.'
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const selectedSubmission = submissions.find((s) => s.id === selectedSubmissionId);
  const relatedAssignment = selectedSubmission
    ? assignments.find((a) => a.id === selectedSubmission.assignmentId)
    : null;

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionId) return;

    await gradeSubmission(selectedSubmissionId, Number(marksInput), feedbackInput);
    setSavedNotice(true);
    triggerCelebrationConfetti();
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-slate-100 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <button onClick={onBack} className="text-xs text-slate-400 hover:text-white mb-1">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-emerald-400" />
            <span>Assignment Submissions & Mentor Grading</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inspect laboratory calculations, schematic diagrams, award grades, and provide feedback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Submissions List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Submissions ({submissions.length})
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {submissions.map((sub) => {
              const assign = assignments.find((a) => a.id === sub.assignmentId);
              const isSelected = sub.id === selectedSubmissionId;

              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubmissionId(sub.id);
                    setMarksInput(sub.marks || 18);
                    setFeedbackInput(sub.feedback || '');
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{sub.studentName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sub.status === 'reviewed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {sub.status === 'reviewed' ? `Graded: ${sub.marks}` : 'Pending'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {assign?.title || 'Course Assignment'}
                  </p>

                  <span className="text-[10px] text-slate-500 mt-2 block">
                    Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Submission Detail & Grading Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSubmission ? (
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
              {/* Assignment Overview */}
              <div className="pb-4 border-b border-slate-800">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Assignment Topic
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                  {relatedAssignment?.title || 'Full-Wave Bridge Rectifier with Filter'}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {relatedAssignment?.description}
                </p>
              </div>

              {/* Student's Submission Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Student Solution: {selectedSubmission.studentName}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Format: {selectedSubmission.submissionType || 'text'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedSubmission.content}
                </div>
              </div>

              {/* Mentor Feedback & Grading Form */}
              <form onSubmit={handleGrade} className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>Award Marks & Write Constructive Feedback</span>
                  </h3>
                  {savedNotice && (
                    <span className="text-xs text-emerald-400 font-bold animate-pulse">
                      ✓ Feedback Saved & Published to Student
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Awarded Marks (Out of {relatedAssignment?.maxMarks || 20})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={relatedAssignment?.maxMarks || 20}
                      required
                      value={marksInput}
                      onChange={(e) => setMarksInput(parseInt(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Faculty Engineering Feedback
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="e.g. Excellent circuit design. Improve the explanation of ripple factor..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save & Notify Student</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 border border-slate-800 rounded-3xl">
              Select a student submission on the left to grade.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
