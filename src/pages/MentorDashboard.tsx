import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { Course, CourseAccessKey, AuthorizedStudent } from '../types';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Award,
  Upload,
  Plus,
  Key,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  FilePlus,
  Clock,
  Layers,
  Activity,
  UserCheck,
  UserPlus,
  Lock,
  Copy,
  Check,
  Trash2,
  Ticket,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ExternalLink,
  Download,
  Search,
  Filter,
} from 'lucide-react';

interface MentorDashboardProps {
  onNavigateToUpload: (courseId?: string) => void;
  onNavigateToTestBuilder: (courseId?: string) => void;
  onNavigateToAssignments: () => void;
  onSelectCourse: (courseId: string) => void;
  onOpenChangePassword?: () => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({
  onNavigateToUpload,
  onNavigateToTestBuilder,
  onNavigateToAssignments,
  onSelectCourse,
  onOpenChangePassword,
}) => {
  const {
    currentUser,
    authorizedStudents,
    authorizeStudentByMentor,
    createAndAuthorizePaidStudent,
    updateStudentStatus,
    deleteStudentRequest,
  } = useAuth();

  const {
    courses,
    modules,
    lessons,
    enrollments,
    submissions,
    tests,
    createCourse,
    generateCourseKey,
    ensureCourseForStudent,
  } = useLMS();

  // Create Course Modal State
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState(49.99);
  const [newCategory, setNewCategory] = useState('Hardware & Circuits');
  const [newLevel, setNewLevel] = useState('Beginner to Advanced');
  const [newDuration, setNewDuration] = useState('14 Hours • 16 Lessons');

  // Authorise Paid Student Modal State
  const [showAuthoriseModal, setShowAuthoriseModal] = useState(false);
  const [authStudentName, setAuthStudentName] = useState('');
  const [authStudentEmail, setAuthStudentEmail] = useState('');
  const [authStudentPhone, setAuthStudentPhone] = useState('');
  const [authCourseId, setAuthCourseId] = useState(courses[0]?.id || '');
  const [customCourseTitleInput, setCustomCourseTitleInput] = useState('');
  const [authPassword, setAuthPassword] = useState(`Inno@${Math.floor(1000 + Math.random() * 9000)}`);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [authCourseKey, setAuthCourseKey] = useState(`INNO-ELEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [authOtp, setAuthOtp] = useState(Math.floor(1000 + Math.random() * 9000).toString());

  // Credentials Slip Modal
  const [issuedSlipStudent, setIssuedSlipStudent] = useState<AuthorizedStudent | null>(null);

  // Key Generator Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedCourseForKey, setSelectedCourseForKey] = useState(courses[0]?.id || '');
  const [customKeyCode, setCustomKeyCode] = useState('');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<CourseAccessKey | null>(null);

  // Table Editing & Search State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentPasswordInput, setStudentPasswordInput] = useState('');
  const [studentKeyInput, setStudentKeyInput] = useState('');
  const [studentOtpInput, setStudentOtpInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'authorized' | 'pending'>('all');

  // Metrics
  const totalCourses = courses.length;
  const activeAuthorizedStudents = authorizedStudents.filter((s) => s.status === 'authorized');
  const pendingAuthorizationStudents = authorizedStudents.filter(
    (s) => s.status === 'pending_mentor_approval'
  );
  const totalStudents = activeAuthorizedStudents.length + enrollments.length;
  const publishedCourses = courses.filter((c) => c.isPublished).length;
  const pendingSubmissionsCount = submissions.filter(
    (s) => s.status === 'submitted' || s.marks === undefined
  ).length;

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createCourse({
      mentorId: currentUser?.uid || 'mentor-default',
      mentorName: currentUser?.displayName || 'Faculty Mentor',
      title: newTitle,
      description: newDescription,
      price: Number(newPrice),
      category: newCategory,
      level: newLevel,
      duration: newDuration,
      learningOutcomes: [
        'Understand circuit schematics and electrical governing equations',
        'Analyze hardware behavior under AC/DC loads',
        'Build and test real electronics prototypes on breadboards',
      ],
      coverImage:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      isPublished: true,
    });

    setShowCreateCourseModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  const handleGenerateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForKey) return;
    const res = await generateCourseKey(
      selectedCourseForKey,
      customKeyCode.trim().toUpperCase() || undefined
    );
    setGeneratedKeyResult(res);
    setCustomKeyCode('');
  };

  // Authorise New Paid Student directly
  const handleAddNewPaidStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authStudentName.trim() || !authStudentEmail.trim()) return;

    let targetCourseId = authCourseId;
    let targetCourseTitle = '';

    if (authCourseId === 'custom') {
      targetCourseTitle = customCourseTitleInput.trim() || 'Hardware & Electronics Engineering';
      targetCourseId = `course-${Date.now()}`;
      await ensureCourseForStudent(targetCourseId, targetCourseTitle);
    } else {
      const courseObj = courses.find((c) => c.id === authCourseId);
      targetCourseTitle = courseObj ? courseObj.title : 'Hardware & Electronics Engineering Curriculum';
      if (!courseObj && authCourseId) {
        await ensureCourseForStudent(authCourseId, targetCourseTitle);
      }
    }

    try {
      const created = await createAndAuthorizePaidStudent({
        name: authStudentName.trim(),
        email: authStudentEmail.trim(),
        phone: authStudentPhone.trim(),
        courseId: targetCourseId || courses[0]?.id || 'course-electronics-core',
        courseTitle: targetCourseTitle,
        password: authPassword.trim(),
        courseKey: authCourseKey.trim().toUpperCase(),
        otp: authOtp.trim(),
      });

      setShowAuthoriseModal(false);
      setIssuedSlipStudent(created);
      setActionSuccessMsg(
        `Successfully authorised ${created.name}! Password and Course Key issued.`
      );

      // Reset form
      setAuthStudentName('');
      setAuthStudentEmail('');
      setAuthStudentPhone('');
      setCustomCourseTitleInput('');
      setAuthPassword(`Inno@${Math.floor(1000 + Math.random() * 9000)}`);
      setAuthCourseKey(`INNO-ELEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
      setAuthOtp(Math.floor(1000 + Math.random() * 9000).toString());
    } catch (err: any) {
      alert(err.message || 'Failed to authorize student.');
    }
  };

  // Authorise an existing pending student from table
  const handleAuthorizeExistingStudent = async (student: AuthorizedStudent) => {
    const passwordToUse =
      studentPasswordInput.trim() ||
      student.mentorPassword ||
      `Inno@${Math.floor(1000 + Math.random() * 9000)}`;

    const keyToUse =
      studentKeyInput.trim().toUpperCase() ||
      student.courseKey ||
      `INNO-ELEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const otpToUse =
      studentOtpInput.trim() ||
      student.otpCode ||
      Math.floor(1000 + Math.random() * 9000).toString();

    try {
      const updated = await authorizeStudentByMentor(student.id, passwordToUse, otpToUse, keyToUse);
      setActionSuccessMsg(
        `Authorised ${updated.name}! Password: "${passwordToUse}" | Course Key: "${keyToUse}"`
      );
      setEditingStudentId(null);
      setStudentPasswordInput('');
      setStudentKeyInput('');
      setStudentOtpInput('');
      setIssuedSlipStudent(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to authorize student');
    }
  };

  const handleCopyCredentials = (student: AuthorizedStudent) => {
    const text = `🎓 InnoLink Technologies - Student Course Access Credentials

Student Name:          ${student.name}
Login Email:           ${student.email}
Authorised Password:   ${student.mentorPassword || 'Pending'}
Course Enrolled:       ${student.courseTitle || 'Hardware & Electronics Engineering'}
Course Key (To Study): ${student.courseKey || 'INNO-ELEC-ACTIVE'}
4-Digit Security OTP:  ${student.otpCode}

Sign In Portal:        ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadSlip = (student: AuthorizedStudent) => {
    const text = `=====================================================
🎓 INNOLINK TECHNOLOGIES - STUDENT ENROLLMENT & STUDY PASS
=====================================================

Student Name:          ${student.name}
Login Email:           ${student.email}
Mentor-Set Password:   ${student.mentorPassword || 'Not set'}
4-Digit Security OTP:  ${student.otpCode}

Course Enrolled:       ${student.courseTitle || 'Hardware & Electronics Engineering'}
COURSE KEY (TO STUDY): ${student.courseKey || 'INNO-ELEC-ACTIVE'}
Enrollment Status:     PAID & AUTHORISED
Authorised By:         ${student.authorizedByMentor || 'Faculty Mentor'}

Sign In Portal:        ${window.location.origin}

Instructions to Study:
1. Go to ${window.location.origin}.
2. Click "Sign In" and select "Student Portal".
3. Sign in with your Login Email: ${student.email} and Password.
4. Enter the 4-digit Security OTP: ${student.otpCode}.
5. Your course is unlocked with your Course Key! Click "Start Studying Course".
=====================================================`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InnoLink_Student_Pass_${student.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-100 space-y-6">
      {/* 1. MENTOR WELCOME & TOP BAR */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Faculty Mentor Portal (Single Administrator)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome, {currentUser?.displayName || 'Faculty Mentor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Authorise paid students, issue login passwords, generate course keys to study, and manage curriculum modules.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          {onOpenChangePassword && (
            <button
              onClick={onOpenChangePassword}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mentor Password</span>
            </button>
          )}

          <button
            onClick={() => setShowKeyModal(true)}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Generate Keys</span>
          </button>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. THE 4 CORE METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Courses</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalCourses}</div>
          <div className="text-[11px] text-slate-500 mt-1">Curriculums Created</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Authorised Students</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalStudents}</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {pendingAuthorizationStudents.length} Pending Approval
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Published Courses</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{publishedCourses}</div>
          <div className="text-[11px] text-slate-500 mt-1">Live in Catalog</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pending Submissions</span>
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{pendingSubmissionsCount}</div>
          <div className="text-[11px] text-amber-400 mt-1">Practical Labs to Grade</div>
        </div>
      </div>

      {/* 3. AUTHORISE STUDENT IN MENTOR PORTAL (CORE FEATURE) */}
      <div className="p-6 rounded-2xl border border-cyan-500/30 bg-slate-900/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Authorise Student & Issue Course Key
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorised students who paid for the course receive their Login Email, Password, and unique Course Key to study the curriculum.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAuthStudentName('');
                setAuthStudentEmail('');
                setAuthStudentPhone('');
                setAuthCourseId(courses[0]?.id || '');
                setCustomCourseTitleInput('');
                setAuthPassword(`Inno@${Math.floor(1000 + Math.random() * 9000)}`);
                setAuthCourseKey(`INNO-ELEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
                setAuthOtp(Math.floor(1000 + Math.random() * 9000).toString());
                setShowAuthoriseModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Authorise Paid Student</span>
            </button>
          </div>
        </div>

        {/* Pending Student Notification Alert */}
        {pendingAuthorizationStudents.length > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-semibold">
                ⚠️ {pendingAuthorizationStudents.length} student application(s) awaiting payment verification & Course Key issuance.
              </span>
            </div>
            <button
              onClick={() => {
                setStatusFilter('pending');
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-semibold transition cursor-pointer self-start sm:self-auto"
            >
              View Pending Approvals ({pendingAuthorizationStudents.length})
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="Search by student name, email..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({authorizedStudents.length})
            </button>
            <button
              onClick={() => setStatusFilter('authorized')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === 'authorized'
                  ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Authorised ({activeAuthorizedStudents.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-950 border border-amber-500/40 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({pendingAuthorizationStudents.length})
            </button>
          </div>
        </div>

        {authorizedStudents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <p>No student records found yet.</p>
            <button
              onClick={() => setShowAuthoriseModal(true)}
              className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
            >
              Click here to Authorise a Paid Student and issue login credentials + Course Key.
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider bg-slate-950/50">
                <tr>
                  <th className="py-2.5 px-3">Student & Email</th>
                  <th className="py-2.5 px-3">Course Paid For</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Login Password</th>
                  <th className="py-2.5 px-3">Course Key (To Study)</th>
                  <th className="py-2.5 px-3">Security OTP</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {authorizedStudents
                  .filter((st) => {
                    if (statusFilter === 'authorized') return st.status === 'authorized';
                    if (statusFilter === 'pending') return st.status === 'pending_mentor_approval';
                    return true;
                  })
                  .filter((st) => {
                    if (!studentSearchQuery.trim()) return true;
                    const q = studentSearchQuery.toLowerCase();
                    return (
                      st.name.toLowerCase().includes(q) ||
                      st.email.toLowerCase().includes(q) ||
                      (st.courseTitle && st.courseTitle.toLowerCase().includes(q)) ||
                      (st.courseKey && st.courseKey.toLowerCase().includes(q))
                    );
                  })
                  .map((st) => {
                    const isEditing = editingStudentId === st.id;
                    const isPending = st.status === 'pending_mentor_approval';

                    return (
                      <tr key={st.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{st.name}</div>
                          <div className="text-[11px] text-slate-400">{st.email}</div>
                          {st.phone && <div className="text-[10px] text-slate-500">{st.phone}</div>}
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-slate-300 font-medium line-clamp-1 max-w-[160px]">
                            {st.courseTitle || 'Hardware & Electronics Engineering'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {st.status === 'authorized' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ✓ Paid & Authorised
                            </span>
                          ) : st.status === 'pending_mentor_approval' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                              ⏳ Pending Approval
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Login Password */}
                        <td className="py-3 px-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={studentPasswordInput}
                                onChange={(e) => setStudentPasswordInput(e.target.value)}
                                placeholder="Set Password"
                                className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setStudentPasswordInput(
                                    `Inno@${Math.floor(1000 + Math.random() * 9000)}`
                                  )
                                }
                                className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                              >
                                Auto
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="text-cyan-300">
                                {st.mentorPassword ? (
                                  visiblePasswords[st.id] ? (
                                    st.mentorPassword
                                  ) : (
                                    '••••••••'
                                  )
                                ) : (
                                  '—'
                                )}
                              </span>
                              {st.mentorPassword && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVisiblePasswords((prev) => ({
                                        ...prev,
                                        [st.id]: !prev[st.id],
                                      }))
                                    }
                                    className="text-slate-500 hover:text-cyan-400 transition cursor-pointer"
                                    title={visiblePasswords[st.id] ? 'Hide Password' : 'Show Password'}
                                  >
                                    {visiblePasswords[st.id] ? (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(st.mentorPassword!);
                                      setCopiedId(`pwd-${st.id}`);
                                      setTimeout(() => setCopiedId(null), 2000);
                                    }}
                                    className="text-slate-500 hover:text-cyan-400 transition cursor-pointer"
                                    title="Copy Password"
                                  >
                                    {copiedId === `pwd-${st.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Course Key to Study */}
                        <td className="py-3 px-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={studentKeyInput}
                              onChange={(e) => setStudentKeyInput(e.target.value)}
                              placeholder="INNO-ELEC-XXXX"
                              className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-emerald-300 uppercase font-mono focus:outline-none"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] font-bold">
                                {st.courseKey || 'INNO-ELEC-UNSET'}
                              </span>
                              {st.courseKey && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(st.courseKey!);
                                    setCopiedId(`key-${st.id}`);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="text-slate-500 hover:text-emerald-400 transition cursor-pointer"
                                  title="Copy Course Key"
                                >
                                  {copiedId === `key-${st.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 4-digit OTP */}
                        <td className="py-3 px-3 font-mono font-bold text-amber-300">
                          {isEditing ? (
                            <input
                              type="text"
                              maxLength={4}
                              value={studentOtpInput}
                              onChange={(e) => setStudentOtpInput(e.target.value)}
                              placeholder="4-digit"
                              className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-amber-300 font-mono focus:outline-none text-center"
                            />
                          ) : (
                            st.otpCode || '—'
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleAuthorizeExistingStudent(st)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                                >
                                  Save & Issue
                                </button>
                                <button
                                  onClick={() => setEditingStudentId(null)}
                                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    if (isPending) {
                                      // Pre-fill modal for direct approval
                                      setAuthStudentName(st.name);
                                      setAuthStudentEmail(st.email);
                                      setAuthStudentPhone(st.phone || '');
                                      setAuthCourseId(st.courseId || courses[0]?.id || '');
                                      setAuthPassword(st.mentorPassword || `Inno@${Math.floor(1000 + Math.random() * 9000)}`);
                                      setAuthCourseKey(st.courseKey || `INNO-ELEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
                                      setAuthOtp(st.otpCode || Math.floor(1000 + Math.random() * 9000).toString());
                                      setShowAuthoriseModal(true);
                                    } else {
                                      setEditingStudentId(st.id);
                                      setStudentPasswordInput(
                                        st.mentorPassword || `Inno@${Math.floor(1000 + Math.random() * 9000)}`
                                      );
                                      setStudentKeyInput(
                                        st.courseKey ||
                                          `INNO-ELEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
                                      );
                                      setStudentOtpInput(
                                        st.otpCode || Math.floor(1000 + Math.random() * 9000).toString()
                                      );
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    isPending
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  {isPending ? '✓ Authorise & Issue Key' : 'Edit Credentials'}
                                </button>

                                {st.status === 'authorized' && (
                                  <>
                                    <button
                                      onClick={() => handleCopyCredentials(st)}
                                      className="p-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                                      title="Copy Login & Course Key Slip"
                                    >
                                      {copiedId === st.id ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                                      )}
                                    </button>

                                    <button
                                      onClick={() => handleDownloadSlip(st)}
                                      className="p-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                                      title="Download Student Pass (.txt)"
                                    >
                                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => deleteStudentRequest(st.id)}
                                  className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                  title="Delete Registration"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. CLEAR QUICK ACTIONS BAR */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
          Quick Faculty Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setShowAuthoriseModal(true)}
            className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-left transition cursor-pointer group"
          >
            <UserPlus className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Authorise Student</div>
            <div className="text-[10px] text-slate-400">Issue password & key</div>
          </button>

          <button
            onClick={() => setShowCreateCourseModal(true)}
            className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-left transition cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Create Course</div>
            <div className="text-[10px] text-slate-400">New curriculum</div>
          </button>

          <button
            onClick={() => onNavigateToUpload()}
            className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-left transition cursor-pointer group"
          >
            <Upload className="w-4 h-4 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Upload Video</div>
            <div className="text-[10px] text-slate-400">Sequential modules</div>
          </button>

          <button
            onClick={() => onNavigateToTestBuilder()}
            className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-left transition cursor-pointer group"
          >
            <Award className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Create Test</div>
            <div className="text-[10px] text-slate-400">Module quiz builder</div>
          </button>
        </div>
      </div>

      {/* 5. PUBLISHED COURSES MANAGEMENT TABLE */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Published Courses</h3>
            <p className="text-[11px] text-slate-400">Manage structure, modules, and tests</p>
          </div>
          <button
            onClick={() => setShowCreateCourseModal(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            + New Course
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No courses published yet. Click "Create Course" to build your first curriculum.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {courses.map((c) => {
              const courseMods = modules.filter((m) => m.courseId === c.id);
              const courseLes = lessons.filter((l) => l.courseId === c.id);
              return (
                <div
                  key={c.id}
                  className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => onSelectCourse(c.id)}
                        className="text-xs sm:text-sm font-bold text-white hover:text-cyan-400 transition cursor-pointer truncate"
                      >
                        {c.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold shrink-0">
                        Published
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{courseMods.length} Modules</span>
                      <span>•</span>
                      <span>{courseLes.length} Video Lessons</span>
                      <span>•</span>
                      <span className="text-cyan-400 font-mono">${c.price}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigateToUpload(c.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3 text-emerald-400" />
                      <span>Add Video</span>
                    </button>

                    <button
                      onClick={() => onNavigateToTestBuilder(c.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>Test</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCourseForKey(c.id);
                        setShowKeyModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 text-xs text-cyan-300 transition cursor-pointer"
                    >
                      Keys
                    </button>

                    <button
                      onClick={() => onSelectCourse(c.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: AUTHORISE PAID STUDENT & ISSUE COURSE KEY */}
      {showAuthoriseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl my-6">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Authorise Student (Paid Course Access)</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Enter the student's details. The system generates their login credentials and Course Key so they can start studying immediately.
            </p>

            <form onSubmit={handleAddNewPaidStudentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={authStudentName}
                  onChange={(e) => setAuthStudentName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student Login Email Address</label>
                <input
                  type="email"
                  required
                  value={authStudentEmail}
                  onChange={(e) => setAuthStudentEmail(e.target.value)}
                  placeholder="alex.mercer@example.com"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={authStudentPhone}
                  onChange={(e) => setAuthStudentPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Paid Course</label>
                <select
                  value={authCourseId}
                  onChange={(e) => setAuthCourseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (${c.price})
                    </option>
                  ))}
                  <option value="custom">+ Type Custom / New Curriculum Title</option>
                </select>
              </div>

              {authCourseId === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 mb-1">
                    Custom Course Curriculum Title
                  </label>
                  <input
                    type="text"
                    required
                    value={customCourseTitleInput}
                    onChange={(e) => setCustomCourseTitleInput(e.target.value)}
                    placeholder="e.g. Embedded IoT & Hardware Engineering"
                    className="w-full rounded-lg border border-cyan-500/40 bg-slate-950 p-2 text-xs text-cyan-200 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Set Login Password</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                        className="text-[10px] text-slate-400 hover:text-white"
                        title={showPasswordInModal ? 'Hide' : 'Show'}
                      >
                        {showPasswordInModal ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthPassword(`Inno@${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                  <input
                    type={showPasswordInModal ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Course Key (To Study)</label>
                    <button
                      type="button"
                      onClick={() =>
                        setAuthCourseKey(
                          `INNO-ELEC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
                        )
                      }
                      className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      Generate Key
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={authCourseKey}
                    onChange={(e) => setAuthCourseKey(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-emerald-300 uppercase font-mono font-bold focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">4-Digit Security OTP</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={authOtp}
                  onChange={(e) => setAuthOtp(e.target.value)}
                  className="w-24 rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-amber-300 text-center font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Payment verified. Authorising unlocks all video lessons and practical tests immediately.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAuthoriseModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authorise & Issue Course Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUED CREDENTIALS & COURSE KEY SLIP */}
      {issuedSlipStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">Student Authorised Successfully!</h3>
                <p className="text-[11px] text-slate-400">Share these login credentials and Course Key with the student.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Student Name:</span>
                <span className="text-white font-bold">{issuedSlipStudent.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Login Email:</span>
                <span className="text-cyan-300 font-bold select-all">{issuedSlipStudent.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Password:</span>
                <span className="text-cyan-300 font-bold select-all">{issuedSlipStudent.mentorPassword}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Course Key (To Study):</span>
                <span className="text-emerald-300 font-extrabold select-all">{issuedSlipStudent.courseKey}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Security OTP:</span>
                <span className="text-amber-300 font-bold select-all">{issuedSlipStudent.otpCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Course:</span>
                <span className="text-slate-200 text-right truncate max-w-[200px]">{issuedSlipStudent.courseTitle}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIssuedSlipStudent(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Done
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSlip(issuedSlipStudent)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                  title="Download slip as text file"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download .txt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyCredentials(issuedSlipStudent)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full Credentials & Key</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Create New Electronics Course</h3>
            <p className="text-xs text-slate-400 mb-4">Set title, description, and one-time payment fee</p>
            <form onSubmit={handleCreateCourseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Microcontroller Interfacing & Embedded C"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explain the technical concepts and hands-on laboratory goals..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Hardware & Circuits">Hardware & Circuits</option>
                    <option value="Embedded & IoT">Embedded & IoT</option>
                    <option value="PCB & Fabrication">PCB & Fabrication</option>
                    <option value="Robotics & Control">Robotics & Control</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">One-Time Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KEY GENERATOR MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Generate Course Activation Key</h3>
            <p className="text-xs text-slate-400">
              Generate unique activation codes for scholarship or sponsored enrollment.
            </p>

            <form onSubmit={handleGenerateKeySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Course</label>
                <select
                  value={selectedCourseForKey}
                  onChange={(e) => setSelectedCourseForKey(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (${c.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom Code (Optional)
                </label>
                <input
                  type="text"
                  value={customKeyCode}
                  onChange={(e) => setCustomKeyCode(e.target.value)}
                  placeholder="e.g. LAB-BATCH-2026"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-cyan-300 uppercase font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {generatedKeyResult && (
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-center space-y-1">
                  <span className="text-[11px] text-slate-400 block">Generated Key Code:</span>
                  <span className="font-mono text-base font-bold text-cyan-400 block select-all">
                    {generatedKeyResult.key}
                  </span>
                  <span className="text-[10px] text-emerald-400 block">Ready to share with students</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowKeyModal(false);
                    setGeneratedKeyResult(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
