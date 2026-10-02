import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { saveVideoFile, resolveVideoUrl } from '../lib/videoStorage';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  FileText,
  Video,
  ArrowRight,
  Plus,
  Trash2,
  Play,
  Layers,
  Check,
  CreditCard,
  DollarSign,
  Clock,
  AlertCircle,
  Film,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MentorUploadPageProps {
  initialCourseId?: string;
  onSuccess: (courseId: string, lessonId: string) => void;
  onBack: () => void;
}

interface VideoLessonDraft {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoFile?: File | null;
  videoDuration: number;
  notes: string;
  previewUrl?: string;
}

interface ModuleDraft {
  id: string;
  title: string;
  description: string;
  videos: VideoLessonDraft[];
}

export const MentorUploadPage: React.FC<MentorUploadPageProps> = ({
  initialCourseId,
  onSuccess,
  onBack,
}) => {
  const { currentUser } = useAuth();
  const { courses, modules, lessons, createCourse, createModule, createLesson, generateAISummaryForLesson } = useLMS();

  // Mode: 'full_course' (build structured multi-module curriculum) or 'single_lesson' (append to existing)
  const [builderMode, setBuilderMode] = useState<'full_course' | 'single_lesson'>('full_course');

  // Full Course Form State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [category, setCategory] = useState('Hardware & Circuits');
  const [level, setLevel] = useState('Beginner to Advanced');
  const [price, setPrice] = useState(49.99);
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80');

  // Pre-structured Modules in Order: Module 1 (Video 1, 2, 3, 4), Module 2 (Video 1, 2, 3, 4)
  const [draftModules, setDraftModules] = useState<ModuleDraft[]>([
    {
      id: 'draft-mod-1',
      title: 'Module 1: Circuit Foundations & Fundamentals',
      description: 'Core electrical theory, Ohm law, circuit schematics, and bench power supply setup.',
      videos: [
        {
          id: 'v-1-1',
          title: 'Introduction to Voltage, Current, and Resistance',
          description: 'Fundamental units, multimeter verification, and basic circuit loop calculations.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          videoDuration: 480,
          notes: 'V = I * R. Power P = V * I.',
        },
        {
          id: 'v-1-2',
          title: 'Resistors, Capacitors, and Inductors in Action',
          description: 'Passive components, filtering ripples, and RC time constants with oscilloscope.',
          videoUrl: '',
          videoDuration: 540,
          notes: 'Time constant tau = R * C.',
        },
        {
          id: 'v-1-3',
          title: 'Semiconductor Diodes and Bridge Rectifiers',
          description: 'Forward bias, reverse breakdown voltage, and full-wave rectification circuits.',
          videoUrl: '',
          videoDuration: 620,
          notes: 'Diode drop ~0.7V for silicon 1N4007.',
        },
        {
          id: 'v-1-4',
          title: 'Voltage Regulation with Zener and Linear Regulators',
          description: 'Building clean 5V and 3.3V DC power rails using LM7805 and decoupling capacitors.',
          videoUrl: '',
          videoDuration: 700,
          notes: 'Verify heat sink dissipation for high Vin - Vout.',
        },
      ],
    },
    {
      id: 'draft-mod-2',
      title: 'Module 2: Microcontroller Interfacing & Digital Logic',
      description: 'Connecting sensors, actuators, and SPI/I2C communication protocols to processors.',
      videos: [
        {
          id: 'v-2-1',
          title: 'Microcontroller Architecture & GPIO Programming',
          description: 'Clock frequencies, register configuration, and high/low pin state driving.',
          videoUrl: '',
          videoDuration: 520,
          notes: 'Configure pin modes as input pullup or push-pull output.',
        },
        {
          id: 'v-2-2',
          title: 'Analog-to-Digital Conversion (ADC) & Sensor Sampling',
          description: 'Sampling temperature, light, and potentiometer voltages with 10-bit resolution.',
          videoUrl: '',
          videoDuration: 580,
          notes: 'ADC value = (Vin / Vref) * 1023.',
        },
        {
          id: 'v-2-3',
          title: 'I2C and SPI Peripheral Communication Bus',
          description: 'Master-slave clocking, addressing OLED displays, and IMU sensor data capture.',
          videoUrl: '',
          videoDuration: 650,
          notes: 'SDA and SCL require 4.7k ohm pull-up resistors.',
        },
        {
          id: 'v-2-4',
          title: 'Pulse-Width Modulation (PWM) & Motor Control',
          description: 'Duty cycle variation, H-Bridge drivers, and brushless motor speed modulation.',
          videoUrl: '',
          videoDuration: 720,
          notes: 'PWM frequency must exceed motor acoustic range (>20kHz).',
        },
      ],
    },
  ]);

  // Single Lesson Quick Mode State (if user wants to append a single video)
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || courses[0]?.id || '');
  const courseModules = modules.filter((m) => m.courseId === selectedCourseId);
  const [selectedModuleId, setSelectedModuleId] = useState(courseModules[0]?.id || 'new_module');
  const [singleLessonTitle, setSingleLessonTitle] = useState('');
  const [singleLessonDesc, setSingleLessonDesc] = useState('');
  const [singleLessonUrl, setSingleLessonUrl] = useState('');
  const [singleLessonNotes, setSingleLessonNotes] = useState('');

  // Publishing & AI Status State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgressText, setPublishProgressText] = useState('');
  const [activePreviewVideo, setActivePreviewVideo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add new module to curriculum
  const handleAddModule = () => {
    const nextModNum = draftModules.length + 1;
    const newModule: ModuleDraft = {
      id: `draft-mod-${Date.now()}`,
      title: `Module ${nextModNum}: Advanced Engineering Concepts`,
      description: 'Sequential technical topics and practical implementation.',
      videos: [
        {
          id: `v-${nextModNum}-1`,
          title: `Video 1: Overview and Schematic Layout`,
          description: 'Initial architectural walk-through.',
          videoUrl: '',
          videoDuration: 600,
          notes: '',
        },
        {
          id: `v-${nextModNum}-2`,
          title: `Video 2: Hardware Breadboard Wiring`,
          description: 'Component placement and connection guidelines.',
          videoUrl: '',
          videoDuration: 600,
          notes: '',
        },
        {
          id: `v-${nextModNum}-3`,
          title: `Video 3: Firmware & Debugging Analysis`,
          description: 'Logic analyzer probing and signal verification.',
          videoUrl: '',
          videoDuration: 600,
          notes: '',
        },
        {
          id: `v-${nextModNum}-4`,
          title: `Video 4: Project Verification & Testing`,
          description: 'Final performance characterization.',
          videoUrl: '',
          videoDuration: 600,
          notes: '',
        },
      ],
    };
    setDraftModules([...draftModules, newModule]);
  };

  // Remove a module
  const handleRemoveModule = (modId: string) => {
    if (draftModules.length <= 1) return;
    setDraftModules(draftModules.filter((m) => m.id !== modId));
  };

  // Add a video to a specific module
  const handleAddVideoToModule = (modId: string) => {
    setDraftModules(
      draftModules.map((m) => {
        if (m.id !== modId) return m;
        const nextVidNum = m.videos.length + 1;
        const newVid: VideoLessonDraft = {
          id: `v-${Date.now()}-${nextVidNum}`,
          title: `Video ${nextVidNum}: Lesson Topic Title`,
          description: 'Hands-on instruction and circuit calculation.',
          videoUrl: '',
          videoDuration: 600,
          notes: '',
        };
        return { ...m, videos: [...m.videos, newVid] };
      })
    );
  };

  // Remove a video from a module
  const handleRemoveVideo = (modId: string, vidId: string) => {
    setDraftModules(
      draftModules.map((m) => {
        if (m.id !== modId) return m;
        return { ...m, videos: m.videos.filter((v) => v.id !== vidId) };
      })
    );
  };

  // Update video fields
  const handleUpdateVideo = (modId: string, vidId: string, field: keyof VideoLessonDraft, val: any) => {
    setDraftModules(
      draftModules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          videos: m.videos.map((v) => (v.id === vidId ? { ...v, [field]: val } : v)),
        };
      })
    );
  };

  // Handle Video File Upload for a video card
  const handleVideoFileSelect = async (modId: string, vidId: string, file: File) => {
    try {
      // 1. Save file in IndexedDB for permanent playback persistence
      const storageKey = `vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const savedKeyOrUrl = await saveVideoFile(storageKey, file);

      // 2. Measure actual duration via off-screen video element
      let detectedDuration = 600;
      try {
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.src = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
          tempVideo.onloadedmetadata = () => {
            if (tempVideo.duration && !isNaN(tempVideo.duration)) {
              detectedDuration = Math.round(tempVideo.duration);
            }
            resolve();
          };
          tempVideo.onerror = () => resolve();
        });
      } catch (e) {
        // ignore
      }

      // 3. Update the video in state
      setDraftModules((prev) =>
        prev.map((m) => {
          if (m.id !== modId) return m;
          return {
            ...m,
            videos: m.videos.map((v) => {
              if (v.id !== vidId) return v;
              return {
                ...v,
                videoFile: file,
                videoUrl: savedKeyOrUrl,
                videoDuration: detectedDuration,
                previewUrl: URL.createObjectURL(file),
              };
            }),
          };
        })
      );
    } catch (err: any) {
      console.warn('Failed to load video file:', err);
    }
  };

  // Handle Publish Complete Course with all modules and sequential videos
  const handlePublishCompleteCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      setErrorMsg('Please enter a course title.');
      return;
    }

    setIsPublishing(true);
    setErrorMsg(null);

    try {
      setPublishProgressText('1. Creating course structure with one-time payment pricing...');
      const createdCourse = await createCourse({
        title: courseTitle,
        description: courseDescription || 'Complete comprehensive engineering video curriculum with all module access.',
        category,
        level,
        duration: '14 Hours',
        learningOutcomes: ['Complete mastery of all modules', 'Hands-on practical circuit calculation', 'Laboratory oscilloscope troubleshooting'],
        price: Number(price) || 49.99,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
        mentorId: currentUser?.uid || 'mentor-default',
        mentorName: currentUser?.displayName || 'Prof. InnoLink Mentor',
        isPublished: true,
        syllabus: draftModules.map((m) => m.title),
      });

      let firstCreatedLessonId = '';
      let overallLessonIndex = 1;

      // Iterate through each module sequentially
      for (let mIdx = 0; mIdx < draftModules.length; mIdx++) {
        const mod = draftModules[mIdx];
        setPublishProgressText(`2. Creating Module ${mIdx + 1}: "${mod.title}"...`);

        const createdMod = await createModule(
          createdCourse.id,
          mod.title || `Module ${mIdx + 1}`,
          mIdx + 1,
          mod.description
        );

        // Iterate through each video lesson for this module in exact order
        for (let vIdx = 0; vIdx < mod.videos.length; vIdx++) {
          const vid = mod.videos[vIdx];
          setPublishProgressText(
            `3. Uploading Module ${mIdx + 1} • Video ${vIdx + 1}: "${vid.title}"...`
          );

          // Use real uploaded video URL, pasted URL, or reliable fallback video
          const finalVideoUrl =
            vid.videoUrl.trim() ||
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

          const createdLesson = await createLesson({
            courseId: createdCourse.id,
            moduleId: createdMod.id,
            title: vid.title || `Video ${vIdx + 1}: Technical Lecture`,
            description: vid.description || 'Hands-on schematic circuit walk-through and lab calculations.',
            videoUrl: finalVideoUrl,
            videoDuration: vid.videoDuration || 600,
            order: overallLessonIndex,
            isPublished: true,
            notes: vid.notes || '',
            resources: [{ name: 'Technical Schematic Reference PDF', url: '#' }],
          });

          if (!firstCreatedLessonId) {
            firstCreatedLessonId = createdLesson.id;
          }

          overallLessonIndex++;

          // Auto-generate AI summary with Gemini
          try {
            await generateAISummaryForLesson(createdLesson, createdCourse.title, createdMod.title);
          } catch (e) {
            // Non-blocking
          }
        }
      }

      setPublishProgressText('4. Course and all modules published successfully!');
      setTimeout(() => {
        onSuccess(createdCourse.id, firstCreatedLessonId);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish course curriculum.');
      setIsPublishing(false);
    }
  };

  // Quick single lesson upload handler
  const handlePublishSingleLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !singleLessonTitle.trim()) return;

    setIsPublishing(true);
    try {
      let modId = selectedModuleId;
      if (selectedModuleId === 'new_module') {
        const mod = await createModule(selectedCourseId, 'New Section', courseModules.length + 1);
        modId = mod.id;
      }

      const existingCount = lessons.filter((l) => l.courseId === selectedCourseId).length;
      const lesson = await createLesson({
        courseId: selectedCourseId,
        moduleId: modId,
        title: singleLessonTitle,
        description: singleLessonDesc || 'Video lecture and practical lab exercise.',
        videoUrl: singleLessonUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        videoDuration: 600,
        order: existingCount + 1,
        isPublished: true,
        notes: singleLessonNotes,
        resources: [],
      });

      onSuccess(selectedCourseId, lesson.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish lesson.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Mentor Studio • Sequential Curriculum</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Course & Video Curriculum Builder</h1>
          <p className="text-xs text-slate-400 mt-1">
            Structure your course in order: Module 1 (Video 1, 2, 3, 4), Module 2 (Video 1, 2, 3, 4) with single one-time payment access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBuilderMode(builderMode === 'full_course' ? 'single_lesson' : 'full_course')}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition cursor-pointer"
          >
            {builderMode === 'full_course' ? 'Switch to Quick Single Upload' : 'Switch to Full Course Builder'}
          </button>
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FULL COURSE BUILDER MODE */}
      {builderMode === 'full_course' ? (
        <form onSubmit={handlePublishCompleteCourse} className="space-y-8">
          {/* SECTION 1: Course Info & One-Time Payment */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>1. Course Details & Lifetime Pricing</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Single-Time Payment For All Modules
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Complete Embedded Systems & PCB Hardware Engineering"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course Overview & Description</label>
                <textarea
                  rows={2}
                  required
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Comprehensive hands-on training spanning foundational circuits, schematic design, lab oscilloscopes, and IoT prototyping..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Engineering Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Hardware & Circuits">Hardware & Circuits</option>
                  <option value="Embedded & IoT">Embedded & IoT</option>
                  <option value="PCB & Fabrication">PCB & Fabrication</option>
                  <option value="Robotics & Control">Robotics & Control</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Single-Time Course Fee ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-7 pr-3 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  ✓ Students pay once to unlock Module 1, Module 2, Module 3, and all included videos with lifetime access.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Structured Modules & Sequential Videos */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span>2. Sequential Modules & Video Lessons</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uploaded in order: Module 1 (Video 1, Video 2, Video 3, Video 4) → Module 2 (Video 1, Video 2, Video 3, Video 4)...
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddModule}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Next Module</span>
              </button>
            </div>

            {/* List of Modules */}
            {draftModules.map((mod, modIndex) => (
              <div
                key={mod.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-xl"
              >
                {/* Module Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                      Module {modIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setDraftModules(
                          draftModules.map((m) => (m.id === mod.id ? { ...m, title: newTitle } : m))
                        );
                      }}
                      className="w-full bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b focus:border-cyan-400 mt-0.5"
                      placeholder="Module Title..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddVideoToModule(mod.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-cyan-400" />
                      <span>Add Video to Mod {modIndex + 1}</span>
                    </button>

                    {draftModules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveModule(mod.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                        title="Remove Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Videos in this module */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mod.videos.map((vid, vidIndex) => (
                    <div
                      key={vid.id}
                      className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold">
                          Video {vidIndex + 1}
                        </span>

                        {mod.videos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(mod.id, vid.id)}
                            className="text-slate-600 hover:text-rose-400 transition text-xs"
                            title="Remove Video"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Video {vidIndex + 1} Title
                        </label>
                        <input
                          type="text"
                          required
                          value={vid.title}
                          onChange={(e) =>
                            handleUpdateVideo(mod.id, vid.id, 'title', e.target.value)
                          }
                          placeholder={`Lesson ${vidIndex + 1} Title...`}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      {/* Video Source: Upload File OR paste URL */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Video Source (Select File or Paste Link)
                        </label>

                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleVideoFileSelect(mod.id, vid.id, file);
                            }}
                            className="block w-full text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                          />

                          <input
                            type="text"
                            value={vid.videoUrl}
                            onChange={(e) =>
                              handleUpdateVideo(mod.id, vid.id, 'videoUrl', e.target.value)
                            }
                            placeholder="Or paste MP4, YouTube, or Google Drive URL..."
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] font-mono text-cyan-300 placeholder:font-sans placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Video Player Live Preview */}
                      {vid.videoUrl && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Video Ready • {Math.round(vid.videoDuration / 60)} mins</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setActivePreviewVideo(
                                  activePreviewVideo === vid.id ? null : vid.id
                                )
                              }
                              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-2.5 h-2.5" />
                              <span>{activePreviewVideo === vid.id ? 'Close' : 'Test Play'}</span>
                            </button>
                          </div>

                          {activePreviewVideo === vid.id && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black mt-1">
                              <video
                                src={vid.previewUrl || vid.videoUrl}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 3: Action Buttons */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-white">
                Total Modules: {draftModules.length} • Total Videos:{' '}
                {draftModules.reduce((acc, m) => acc + m.videos.length, 0)}
              </div>
              <div className="text-[11px] text-slate-400">
                Single One-Time Payment: <strong className="text-emerald-400">${price}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPublishing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isPublishing ? 'Publishing Course...' : 'Publish Course & All Modules'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* SINGLE LESSON QUICK UPLOAD MODE */
        <form onSubmit={handlePublishSingleLesson} className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-5">
          <h2 className="text-base font-bold text-white">Quick Upload Single Video Lesson</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} (${c.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Module Section</label>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
              >
                {courseModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
                <option value="new_module">+ New Section</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lesson Title</label>
              <input
                type="text"
                required
                value={singleLessonTitle}
                onChange={(e) => setSingleLessonTitle(e.target.value)}
                placeholder="e.g. Video 5: Pulse-Width Modulation (PWM)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Video File or URL</label>
              <input
                type="file"
                accept="video/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const saved = await saveVideoFile(`vid-${Date.now()}`, file);
                    setSingleLessonUrl(saved);
                  }
                }}
                className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer mb-2"
              />
              <input
                type="text"
                value={singleLessonUrl}
                onChange={(e) => setSingleLessonUrl(e.target.value)}
                placeholder="Or paste video URL (MP4, YouTube, Google Drive)..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lesson Description</label>
              <textarea
                rows={2}
                value={singleLessonDesc}
                onChange={(e) => setSingleLessonDesc(e.target.value)}
                placeholder="Explain the circuit topic and lab calculations..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPublishing || !singleLessonTitle.trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer"
              >
                {isPublishing ? 'Publishing...' : 'Publish Video Lesson'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Progress Modal overlay when publishing */}
      {isPublishing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-white">Publishing Curriculum</h3>
            <p className="text-xs text-cyan-300 font-mono">{publishProgressText}</p>
          </div>
        </div>
      )}
    </div>
  );
};
