import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { Test, TestQuestion, QuestionType } from '../types';
import {
  ClipboardCheck,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface MentorTestBuilderPageProps {
  initialCourseId?: string;
  onSuccess: (testId: string) => void;
  onBack: () => void;
}

export const MentorTestBuilderPage: React.FC<MentorTestBuilderPageProps> = ({
  initialCourseId,
  onSuccess,
  onBack,
}) => {
  const { courses, modules, lessons, createTest } = useLMS();
  const { currentUser } = useAuth();

  const [courseId, setCourseId] = useState(initialCourseId || courses[0]?.id || '');
  const courseModules = modules.filter((m) => m.courseId === courseId);
  const [moduleId, setModuleId] = useState(courseModules[0]?.id || '');

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('Answer all questions. Calculators permitted for numerical derivations.');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passingScore, setPassingScore] = useState(70);

  // Questions List
  const [questions, setQuestions] = useState<TestQuestion[]>([
    {
      id: 'q_init_1',
      type: 'multiple_choice',
      question: 'What is the voltage drop across a forward-biased silicon diode?',
      options: ['0.2V', '0.7V', '1.2V', '5.0V'],
      correctAnswer: 1,
      explanation: 'Silicon PN junctions exhibit an approximate 0.7V forward barrier voltage.',
    },
  ]);

  // AI Question Generation State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('Full Wave Bridge Rectifier & Filter Capacitors');

  const handleAddManualQuestion = () => {
    const newQ: TestQuestion = {
      id: `q_man_${Date.now()}`,
      type: 'multiple_choice',
      question: 'New technical assessment question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: 'Explanation for correct choice.',
    };
    setQuestions([...questions, newQ]);
  };

  const handleGenerateWithGemini = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopicInput || 'Semiconductor Transistors and Circuit Theorems',
          count: 3,
          difficulty: 'intermediate',
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions((prev) => [...prev, ...data.questions]);
      }
    } catch (err) {
      console.error('Failed to generate draft questions:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePublishTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) return;

    const newTest = await createTest({
      courseId,
      moduleId,
      mentorId: currentUser?.uid || 'mentor-karthik',
      title,
      instructions,
      durationMinutes: Number(durationMinutes),
      passingScore: Number(passingScore),
      isPublished: true,
      questions,
    });

    onSuccess(newTest.id);
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-slate-100 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <button onClick={onBack} className="text-xs text-slate-400 hover:text-white mb-1">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-emerald-400" />
            <span>Create & Publish Assessment Test</span>
          </h1>
        </div>
      </div>

      <form onSubmit={handlePublishTest} className="space-y-8">
        {/* Test Settings */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Test Configuration</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Course</label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  const mods = modules.filter((m) => m.courseId === e.target.value);
                  setModuleId(mods[0]?.id || '');
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Module Section</label>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {courseModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Test Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Module 2 Assessment: Diodes & Power Rectification"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Passing Score (%)</label>
              <input
                type="number"
                min="50"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* AI Generator Card (As required in Section 15) */}
        <div className="p-6 rounded-3xl border border-cyan-500/30 bg-slate-900/80 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Generate Draft Questions with Gemini
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Gemini can draft realistic questions for multiple choice, numerical, or true/false types. As mentor, you can inspect, edit, or remove any question prior to publishing.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={aiTopicInput}
              onChange={(e) => setAiTopicInput(e.target.value)}
              placeholder="Topic or lesson focus..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleGenerateWithGemini}
              disabled={isGeneratingAi}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate Drafts</span>
            </button>
          </div>
        </div>

        {/* Questions Editor List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Questions ({questions.length})
            </h3>
            <button
              type="button"
              onClick={handleAddManualQuestion}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-slate-200 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question Manually</span>
            </button>
          </div>

          {questions.map((q, idx) => (
            <div key={q.id || idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">Question {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[idx].question = e.target.value;
                    setQuestions(updated);
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Options */}
              {q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct_${q.id}`}
                        checked={Number(q.correctAnswer) === oIdx}
                        onChange={() => {
                          const updated = [...questions];
                          updated[idx].correctAnswer = oIdx;
                          setQuestions(updated);
                        }}
                        className="text-cyan-500"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...questions];
                          if (updated[idx].options) {
                            updated[idx].options![oIdx] = e.target.value;
                            setQuestions(updated);
                          }
                        }}
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <input
                  type="text"
                  placeholder="Explanation..."
                  value={q.explanation}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[idx].explanation = e.target.value;
                    setQuestions(updated);
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-[11px] text-slate-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={!title.trim() || questions.length === 0}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publish Test to Students</span>
          </button>
        </div>
      </form>
    </div>
  );
};
