import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { Course, CourseAccessKey, AuthorizedStudent, MarketplaceProduct, OrderStatus, CodingLab, HardwareBoard } from '../types';
import { useBranding, DEFAULT_BRANDING } from '../context/BrandingContext';
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
  ShoppingBag,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  Code,
  Cpu,
  Video,
  DollarSign,
  AlertTriangle,
  Send,
  Edit,
  Truck,
  RefreshCw,
  Palette,
  Globe,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { getTermsAndConditions, saveTermsAndConditions } from '../services/termsService';
import { TermsModal } from '../components/terms/TermsModal';

export type AdminTab =
  | 'dashboard'
  | 'courses'
  | 'videos'
  | 'labs'
  | 'tests'
  | 'assignments'
  | 'students'
  | 'products'
  | 'orders'
  | 'payments'
  | 'analytics'
  | 'terms'
  | 'settings';

interface AdminDashboardProps {
  initialTab?: AdminTab;
  onNavigateToCourse?: (courseId: string) => void;
  onNavigateToLesson?: (courseId: string, lessonId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab = 'dashboard',
  onNavigateToCourse,
  onNavigateToLesson,
}) => {
  const {
    currentUser,
    role,
    authorizedStudents,
    authorizeStudentByAdmin,
    updateStudentStatus,
    deleteStudentRequest,
    resetAdminPassword,
    changeOwnerCredentials,
  } = useAuth();

  const {
    courses,
    createCourse,
    updateCourse,
    modules,
    lessons,
    createLesson,
    tests,
    createTest,
    assignments,
    createAssignment,
    submissions,
    gradeSubmission,
    courseAccessKeys,
    generateCourseKey,
  } = useLMS();

  const {
    products,
    createProduct,
    updateProduct,
    orders,
    updateOrderStatusBySeller,
  } = useMarketplace();

  const { branding, updateBranding, resetBranding } = useBranding();
  const [brandingForm, setBrandingForm] = useState(branding);

  // Active Admin Navigation Tab
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------------------------------
  // STATE: Terms & Conditions Management
  // --------------------------------------------------------------------------
  const [termsContent, setTermsContent] = useState('');
  const [termsVersion, setTermsVersion] = useState(1);
  const [termsPublished, setTermsPublished] = useState(true);
  const [termsUpdatedAt, setTermsUpdatedAt] = useState('');
  const [termsUpdatedBy, setTermsUpdatedBy] = useState('Platform Owner');
  const [termsSaving, setTermsSaving] = useState(false);
  const [termsPreviewOpen, setTermsPreviewOpen] = useState(false);

  React.useEffect(() => {
    getTermsAndConditions().then((t) => {
      setTermsContent(t.content);
      setTermsVersion(t.version);
      setTermsPublished(t.published);
      setTermsUpdatedAt(t.updatedAt);
      setTermsUpdatedBy(t.updatedBy || 'Platform Owner');
    });
  }, []);

  const handleSaveTerms = async (publish: boolean) => {
    if (!termsContent.trim()) {
      showToast('Terms content cannot be empty.');
      return;
    }
    setTermsSaving(true);
    try {
      const res = await saveTermsAndConditions(
        termsContent,
        publish,
        termsVersion,
        currentUser?.displayName || 'Platform Owner'
      );
      setTermsVersion(res.version);
      setTermsPublished(res.published);
      setTermsUpdatedAt(res.updatedAt);
      showToast(publish ? `Version ${res.version} Published Successfully!` : 'Draft Saved.');
    } catch (err: any) {
      showToast('Failed to save Terms & Conditions');
    } finally {
      setTermsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // STATE: Owner Credential Changes (5-digit Master PIN Protected)
  // --------------------------------------------------------------------------
  const [masterPin, setMasterPin] = useState('');
  const [newOwnerUsername, setNewOwnerUsername] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [confirmOwnerPassword, setConfirmOwnerPassword] = useState('');
  const [credChangeLoading, setCredChangeLoading] = useState(false);
  const [showMasterPin, setShowMasterPin] = useState(false);
  const [showNewOwnerPassword, setShowNewOwnerPassword] = useState(false);
  const [showConfirmOwnerPassword, setShowConfirmOwnerPassword] = useState(false);

  const handleUpdateOwnerCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPin || masterPin.trim().length !== 5) {
      showToast('Invalid security PIN');
      return;
    }
    if (newOwnerPassword.length < 6) {
      showToast('New password must be at least 6 characters.');
      return;
    }
    if (newOwnerPassword !== confirmOwnerPassword) {
      showToast('New password and confirm password do not match.');
      return;
    }

    setCredChangeLoading(true);
    try {
      const msg = await changeOwnerCredentials(
        masterPin.trim(),
        newOwnerUsername.trim(),
        newOwnerPassword.trim(),
        confirmOwnerPassword.trim()
      );
      showToast(msg);
      setMasterPin('');
      setNewOwnerUsername('');
      setNewOwnerPassword('');
      setConfirmOwnerPassword('');
    } catch (err: any) {
      showToast(err.message || 'Invalid security PIN');
    } finally {
      setCredChangeLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // STATE: Courses
  // --------------------------------------------------------------------------
  const [courseSearch, setCourseSearch] = useState('');
  const [newCourseModalOpen, setNewCourseModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('99.99');
  const [newCourseCategory, setNewCourseCategory] = useState('Embedded Systems');
  const [newCourseLevel, setNewCourseLevel] = useState('Intermediate');
  const [newCourseDuration, setNewCourseDuration] = useState('6 Weeks');

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    createCourse({
      mentorId: currentUser?.uid || 'admin-lead',
      mentorName: currentUser?.displayName || 'Platform Admin',
      title: newCourseTitle.trim(),
      description: newCourseDesc.trim(),
      price: parseFloat(newCoursePrice) || 0,
      category: newCourseCategory,
      level: newCourseLevel,
      duration: newCourseDuration,
      learningOutcomes: ['Hardware interfacing', 'Firmware development', 'System debugging'],
      isPublished: true,
      syllabus: ['Module 1: Architecture', 'Module 2: Peripherals', 'Module 3: Projects'],
    });

    setNewCourseModalOpen(false);
    setNewCourseTitle('');
    setNewCourseDesc('');
    showToast('Course created and published successfully!');
  };

  // --------------------------------------------------------------------------
  // STATE: Videos & AI Processing
  // --------------------------------------------------------------------------
  const [selectedCourseForVideo, setSelectedCourseForVideo] = useState<string>(courses[0]?.id || '');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoNotes, setVideoNotes] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [generatedKeyConcepts, setGeneratedKeyConcepts] = useState<string[]>([]);
  const [videoPublishedSuccess, setVideoPublishedSuccess] = useState(false);

  const handleSimulateGeminiProcessing = () => {
    if (!videoTitle.trim()) {
      showToast('Please enter a lesson title before generating Gemini summary.');
      return;
    }
    setIsProcessingAI(true);
    setTimeout(() => {
      setIsProcessingAI(false);
      setGeneratedSummary(
        `In this lesson on "${videoTitle}", students explore the core operational characteristics of the target hardware architecture, peripheral bus registers, and real-time timing constraints. Key practical laboratory exercises demonstrate circuit wiring and sensor data parsing.`
      );
      setGeneratedKeyConcepts([
        'Register-level memory configuration and peripheral base addresses',
        'Hardware interrupt service routines and debounce filtering',
        'Bus communications: I2C, SPI, and UART timing protocol guarantees',
        'Oscilloscope waveform analysis and noise suppression',
      ]);
      showToast('Gemini AI summary and key concepts generated!');
    }, 1200);
  };

  const handlePublishLesson = () => {
    if (!videoTitle.trim()) return;
    const courseId = selectedCourseForVideo || courses[0]?.id;
    const targetModule = modules.find((m) => m.courseId === courseId) || modules[0];

    createLesson({
      courseId,
      moduleId: targetModule?.id || 'mod-1',
      title: videoTitle.trim(),
      description: videoNotes.trim() || `Comprehensive instructional video on ${videoTitle}.`,
      videoUrl: videoUrl.trim() || 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-microchip-in-close-up-view-41584-large.mp4',
      order: lessons.length + 1,
      isPublished: true,
      notes: videoNotes.trim(),
    });

    setVideoPublishedSuccess(true);
    showToast('Lesson published to course curriculum!');
    setTimeout(() => {
      setVideoTitle('');
      setVideoUrl('');
      setVideoNotes('');
      setGeneratedSummary(null);
      setGeneratedKeyConcepts([]);
      setVideoPublishedSuccess(false);
    }, 2000);
  };

  // --------------------------------------------------------------------------
  // STATE: Practical Labs
  // --------------------------------------------------------------------------
  const [labTitle, setLabTitle] = useState('');
  const [labBoard, setLabBoard] = useState<HardwareBoard>('esp32');
  const [labDesc, setLabDesc] = useState('');
  const [labMarks, setLabMarks] = useState('50');
  const [labsList, setLabsList] = useState<CodingLab[]>([
    {
      id: 'lab-esp32-1',
      courseId: 'course-esp32-201',
      title: 'ESP32 Dual-Core FreeRTOS Blinky & UART Logger',
      description: 'Spawn two independent FreeRTOS tasks to toggle LEDs and log telemetry via UART.',
      board: 'esp32',
      language: 'arduino_c',
      requiredComponents: ['ESP32 Dev Module', 'Breadboard', '2x LEDs', '2x 330Ω Resistors'],
      startingCode: `void setup() {\n  Serial.begin(115200);\n  pinMode(2, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(2, HIGH);\n  delay(500);\n  digitalWrite(2, LOW);\n  delay(500);\n}`,
      instructions: 'Pin 2 is connected to the onboard blue LED. Output UART diagnostics at 115200 baud.',
      expectedOutput: '[TASK 1] Heartbeat pulse at 1Hz',
      marks: 50,
      attemptsAllowed: 3,
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lab-uno-1',
      courseId: 'course-elec-101',
      title: 'Arduino Uno Pulse Width Modulation Motor Control',
      description: 'Use timer PWM to adjust motor speed via an analog potentiometer.',
      board: 'arduino_uno',
      language: 'arduino_c',
      requiredComponents: ['Arduino Uno', 'Potentiometer', 'NPN Transistor', 'DC Motor'],
      startingCode: `int potPin = A0;\nint motorPin = 9;\nvoid setup() { pinMode(motorPin, OUTPUT); }\nvoid loop() { int val = analogRead(potPin); analogWrite(motorPin, val / 4); }`,
      instructions: 'Map analog input A0 (0-1023) to 8-bit PWM (0-255) on pin 9.',
      expectedOutput: 'Motor RPM scales proportionally with wiper voltage.',
      marks: 50,
      attemptsAllowed: 5,
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lab-pico-1',
      courseId: 'course-arm-301',
      title: 'Raspberry Pi Pico RP2040 PIO State Machine',
      description: 'Write custom PIO assembly instructions to generate WS2812B NeoPixel signals.',
      board: 'rp2040_pico',
      language: 'micropython',
      requiredComponents: ['Raspberry Pi Pico', 'WS2812B LED Strip', 'Level Shifter'],
      startingCode: `import rp2\nfrom machine import Pin\n# PIO state machine code here`,
      instructions: 'Configure PIO SM 0 with 800kHz bit frequency.',
      expectedOutput: 'Color wipe animation renders with exact nanosecond timing.',
      marks: 100,
      attemptsAllowed: 3,
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  const handleCreateLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labTitle.trim()) return;

    const newLab: CodingLab = {
      id: `lab-${Date.now()}`,
      courseId: selectedCourseForVideo || courses[0]?.id || 'course-elec-101',
      title: labTitle.trim(),
      description: labDesc.trim() || 'Hands-on hardware lab exercise.',
      board: labBoard,
      language: 'arduino_c',
      requiredComponents: ['Microcontroller board', 'Jumper wires', 'Breadboard'],
      startingCode: '// Starting code template provided by Admin\nvoid setup() {\n}\nvoid loop() {\n}',
      instructions: 'Follow circuit schematic and compile to verify simulation output.',
      expectedOutput: 'Hardware simulation outputs expected state values.',
      marks: parseInt(labMarks, 10) || 50,
      attemptsAllowed: 5,
      isPublished: true,
      createdAt: new Date().toISOString(),
    };

    setLabsList([newLab, ...labsList]);
    setLabTitle('');
    setLabDesc('');
    showToast('Practical hardware lab created and linked to curriculum!');
  };

  // --------------------------------------------------------------------------
  // STATE: Tests
  // --------------------------------------------------------------------------
  const [testTitle, setTestTitle] = useState('');
  const [testInstructions, setTestInstructions] = useState('');
  const [testPassingScore, setTestPassingScore] = useState('70');
  const [testDuration, setTestDuration] = useState('30');
  const [testQ1, setTestQ1] = useState('What is the maximum GPIO operating voltage of an ESP32?');
  const [testQ1Opt, setTestQ1Opt] = useState('3.3V, 5.0V, 1.8V, 12V');
  const [testQ1Ans, setTestQ1Ans] = useState('3.3V');

  const handleCreateTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;

    createTest({
      courseId: selectedCourseForVideo || courses[0]?.id || 'course-elec-101',
      mentorId: currentUser?.uid || 'admin-lead',
      title: testTitle.trim(),
      instructions: testInstructions.trim() || 'Select the most accurate response for each question.',
      durationMinutes: parseInt(testDuration, 10) || 30,
      passingScore: parseInt(testPassingScore, 10) || 70,
      isPublished: true,
      questions: [
        {
          id: `q-${Date.now()}-1`,
          type: 'multiple_choice',
          question: testQ1,
          options: testQ1Opt.split(',').map((s) => s.trim()),
          correctAnswer: testQ1Ans.trim(),
          explanation: 'Standard ESP32 pins are rated for 3.3V logic levels.',
          points: 10,
        },
      ],
    });

    setTestTitle('');
    setTestInstructions('');
    showToast('Examination test created and published to students!');
  };

  // --------------------------------------------------------------------------
  // STATE: Assignments
  // --------------------------------------------------------------------------
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentMarks, setAssignmentMarks] = useState('100');

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim()) return;

    createAssignment({
      courseId: selectedCourseForVideo || courses[0]?.id || 'course-elec-101',
      mentorId: currentUser?.uid || 'admin-lead',
      title: assignmentTitle.trim(),
      description: assignmentDesc.trim(),
      maxMarks: parseInt(assignmentMarks, 10) || 100,
      isPublished: true,
    });

    setAssignmentTitle('');
    setAssignmentDesc('');
    showToast('Assignment created! Students can now submit their coursework.');
  };

  // --------------------------------------------------------------------------
  // STATE: Students & Course Keys
  // --------------------------------------------------------------------------
  const [studentSearch, setStudentSearch] = useState('');
  const [newKeyCourseId, setNewKeyCourseId] = useState(courses[0]?.id || 'course-elec-101');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerateKey = () => {
    const rawKey = `INNO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    generateCourseKey(newKeyCourseId, rawKey);
    showToast(`Access key generated: ${rawKey}`);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Copied to clipboard!');
  };

  // --------------------------------------------------------------------------
  // STATE: STEM Shop & Products (Admin is Seller)
  // --------------------------------------------------------------------------
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState('49.99');
  const [prodStock, setProdStock] = useState('50');
  const [prodCategory, setProdCategory] = useState<'esp32' | 'arduino' | 'pico' | 'robotics' | 'sensors'>('esp32');
  const [prodDesc, setProdDesc] = useState('');
  const [prodComponents, setProdComponents] = useState('Development board, Sensors, Connecting wires');

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim()) return;

    createProduct({
      sellerId: currentUser?.uid || 'admin-lead',
      sellerName: 'InnoLink Official STEM Store',
      title: prodTitle.trim(),
      description: prodDesc.trim() || 'Certified InnoLink hardware kit for hands-on engineering.',
      price: parseFloat(prodPrice) || 0,
      discountPercent: 10,
      stock: parseInt(prodStock, 10) || 1,
      sku: `INNO-HW-${Math.floor(1000 + Math.random() * 9000)}`,
      category: prodCategory,
      boardPlatform: prodCategory as any,
      images: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      ],
      componentsIncluded: prodComponents.split(',').map((s) => s.trim()),
      specifications: { Voltage: '3.3V/5V', Origin: 'InnoLink Technologies' },
      skillLevel: 'Beginner',
      recommendedAge: '12+',
      warranty: '6 Months Replacement',
      shippingInfo: 'Fast 2-3 Day Courier Delivery',
      isApproved: true,
      status: 'approved',
    });

    setProdModalOpen(false);
    setProdTitle('');
    setProdDesc('');
    showToast('STEM Hardware kit added to the official catalog!');
  };

  // --------------------------------------------------------------------------
  // STATE: Settings
  // --------------------------------------------------------------------------
  const [newAdminPass, setNewAdminPass] = useState('');

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding(brandingForm);
    showToast('Platform branding updated globally!');
  };

  const handleResetBranding = () => {
    if (confirm('Reset platform branding to default settings?')) {
      resetBranding();
      setBrandingForm(DEFAULT_BRANDING);
      showToast('Branding restored to defaults.');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo file size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBrandingForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
          showToast('Logo uploaded. Click "Save Platform Branding" to apply.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPass.length < 6) {
      showToast('Admin password must be at least 6 characters.');
      return;
    }
    resetAdminPassword(newAdminPass);
    setNewAdminPass('');
    showToast('Admin master password successfully updated!');
  };

  // Filtered views
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredStudents = authorizedStudents.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.courseTitle && s.courseTitle.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  // Total orders amount
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) + (authorizedStudents.length * 99.99);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 text-[var(--foreground)] transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-[var(--foreground)] text-[var(--background)] text-[10px] font-bold uppercase tracking-wider">
              Innolink Technologies
            </span>
            <span className="text-xs text-[var(--muted-text)] font-medium">
              Owner Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
            Owner Portal
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-1 max-w-2xl">
            Centralized management for engineering curriculum, dynamic video lessons, practical hardware labs, test evaluations, STEM hardware store, payments, student access, and platform policies.
          </p>
        </div>

        {/* Quick Admin Profile Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center font-bold text-sm">
            {currentUser?.displayName?.[0]?.toUpperCase() || 'O'}
          </div>
          <div className="text-xs">
            <p className="font-bold text-[var(--foreground)]">{currentUser?.displayName || 'Innolink Owner'}</p>
            <p className="text-[11px] text-[var(--muted-text)]">{currentUser?.email || 'kkscreative@innolink.tech'}</p>
            <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-500">
              ● Authorized Owner Account
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODULE NAVIGATION TABS */}
      {/* ==================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'videos', label: 'Videos', icon: Video },
          { id: 'labs', label: 'Labs', icon: Code },
          { id: 'tests', label: 'Tests', icon: FileCheck },
          { id: 'assignments', label: 'Assignments', icon: FilePlus },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'products', label: 'STEM Shop', icon: ShoppingBag },
          { id: 'orders', label: 'Orders', icon: Package },
          { id: 'payments', label: 'Payments', icon: DollarSign },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'terms', label: 'Terms & Conditions', icon: FileText },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] border border-[var(--border)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* 1. DASHBOARD OVERVIEW */}
      {/* ==================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between text-[var(--muted-text)] mb-2">
                <span className="text-xs font-semibold">Total Students</span>
                <Users className="w-4 h-4 text-[var(--foreground)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{authorizedStudents.length}</p>
              <p className="text-[11px] text-[var(--muted-text)] mt-1">Authorized learner accounts</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between text-[var(--muted-text)] mb-2">
                <span className="text-xs font-semibold">Active Courses</span>
                <BookOpen className="w-4 h-4 text-[var(--foreground)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{courses.length}</p>
              <p className="text-[11px] text-[var(--muted-text)] mt-1">{lessons.length} video lessons published</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between text-[var(--muted-text)] mb-2">
                <span className="text-xs font-semibold">STEM Hardware Kits</span>
                <ShoppingBag className="w-4 h-4 text-[var(--foreground)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{products.length}</p>
              <p className="text-[11px] text-[var(--muted-text)] mt-1">{orders.length} student orders placed</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between text-[var(--muted-text)] mb-2">
                <span className="text-xs font-semibold">Platform Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">${totalRevenue.toFixed(2)}</p>
              <p className="text-[11px] text-emerald-700 mt-1">Enrollments & STEM sales</p>
            </div>
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Quick Management Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => setActiveTab('videos')}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)] text-left transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[var(--foreground)] mb-1" />
                <p className="text-xs font-bold text-[var(--foreground)]">Upload Video Lesson</p>
                <p className="text-[10px] text-[var(--muted-text)]">Generate Gemini AI summary</p>
              </button>

              <button
                onClick={() => setActiveTab('courses')}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)] text-left transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[var(--foreground)] mb-1" />
                <p className="text-xs font-bold text-[var(--foreground)]">Create New Course</p>
                <p className="text-[10px] text-[var(--muted-text)]">Modules, syllabus, pricing</p>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)] text-left transition cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[var(--foreground)] mb-1" />
                <p className="text-xs font-bold text-[var(--foreground)]">Add STEM Product</p>
                <p className="text-[10px] text-[var(--muted-text)]">Kits, sensors, inventory</p>
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)] text-left transition cursor-pointer"
              >
                <Key className="w-4 h-4 text-[var(--foreground)] mb-1" />
                <p className="text-xs font-bold text-[var(--foreground)]">Issue Course Keys</p>
                <p className="text-[10px] text-[var(--muted-text)]">Authorize student access</p>
              </button>
            </div>
          </div>

          {/* Pending Reviews & Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Coursework Submissions */}
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                  Course Submissions Pending Review ({submissions.filter((s) => s.status === 'submitted').length})
                </h3>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="text-xs text-[var(--muted-text)] hover:text-[var(--foreground)] font-semibold"
                >
                  View All →
                </button>
              </div>
              {submissions.length === 0 ? (
                <p className="text-xs text-[var(--muted-text)] py-3 text-center">No student submissions pending.</p>
              ) : (
                <div className="space-y-2">
                  {submissions.slice(0, 3).map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{sub.studentName}</p>
                        <p className="text-[11px] text-[var(--muted-text)] line-clamp-1">{sub.content}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.status === 'reviewed' ? 'Graded' : 'Needs Grade'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders in STEM Shop */}
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                  Recent STEM Hardware Orders ({orders.length})
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-[var(--muted-text)] hover:text-[var(--foreground)] font-semibold"
                >
                  Manage Orders →
                </button>
              </div>
              {orders.length === 0 ? (
                <p className="text-xs text-[var(--muted-text)] py-3 text-center">No hardware orders placed yet.</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 3).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[var(--foreground)] font-mono">{ord.orderId}</p>
                        <p className="text-[11px] text-[var(--muted-text)]">
                          {ord.items.length} item(s) • ${ord.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-[var(--foreground)] text-[10px] font-bold">
                        {ord.orderStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. COURSE MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted-text)]" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses by title or discipline..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-slate-800"
              />
            </div>
            <button
              onClick={() => setNewCourseModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Course</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((c) => {
              const courseLessons = lessons.filter((l) => l.courseId === c.id);
              const courseModules = modules.filter((m) => m.courseId === c.id);
              return (
                <div
                  key={c.id}
                  className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--foreground)] font-semibold text-[10px]">
                        {c.category}
                      </span>
                      <span className="font-bold text-[var(--foreground)] font-mono">${c.price.toFixed(2)}</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">{c.title}</h3>
                    <p className="text-xs text-[var(--muted-text)] line-clamp-2">{c.description}</p>
                    <div className="pt-2 flex items-center gap-3 text-[11px] text-[var(--muted-text)]">
                      <span>{courseModules.length} Modules</span>
                      <span>•</span>
                      <span>{courseLessons.length} Lessons</span>
                      <span>•</span>
                      <span>{c.level}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <button
                      onClick={() => onNavigateToCourse?.(c.id)}
                      className="text-xs font-semibold text-[var(--foreground)] hover:underline"
                    >
                      View Curriculum →
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          updateCourse(c.id, { isPublished: !c.isPublished });
                          showToast(`Course ${!c.isPublished ? 'published' : 'unpublished'}.`);
                        }}
                        className="px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)] text-[11px] font-medium"
                      >
                        {c.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Archive course "${c.title}"?`)) {
                            updateCourse(c.id, { isPublished: false });
                            showToast('Course archived.');
                          }
                        }}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50"
                        title="Archive Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. VIDEO MANAGEMENT & GEMINI AI PROCESSING */}
      {/* ==================================================== */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload & Form Column */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">Upload & Process Video Lesson</h3>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Upload mentor-recorded video file, run Gemini AI concept analysis, review generated transcript, and publish to course modules.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Target Course</label>
                <select
                  value={selectedCourseForVideo}
                  onChange={(e) => setSelectedCourseForVideo(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Lesson Title</label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. ESP32 FreeRTOS Task Synchronization & Queues"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Video Stream / File URL
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://assets.mixkit.co/videos/preview/mixkit-circuit-board-microchip-in-close-up-view-41584-large.mp4"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Lesson Lecture Notes</label>
                <textarea
                  value={videoNotes}
                  onChange={(e) => setVideoNotes(e.target.value)}
                  placeholder="Key engineering points, formulas, hardware pinouts..."
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs sm:text-sm text-[var(--foreground)]"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSimulateGeminiProcessing}
                  disabled={isProcessingAI}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--foreground)]" />
                  <span>{isProcessingAI ? 'Analyzing with Gemini...' : 'Generate Gemini AI Summary'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublishLesson}
                  className="flex-1 py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Publish Lesson</span>
                </button>
              </div>

              {videoPublishedSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lesson successfully saved and published! Students can now watch and study.</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Output Review Column */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--foreground)]" />
                  <span>Gemini AI Lesson Synthesis</span>
                </span>
                <span className="text-[11px] text-[var(--muted-text)]">Auto-Generates on Upload</span>
              </div>

              <div className="pt-3 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)] mb-1">Executive Summary</h4>
                  <p className="text-xs text-[var(--muted-text)] bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border)] leading-relaxed">
                    {generatedSummary ||
                      'Summary will populate here automatically once you click "Generate Gemini AI Summary" or upload a mentor lesson video.'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)] mb-1">Key Conceptual Pillars</h4>
                  {generatedKeyConcepts.length === 0 ? (
                    <p className="text-xs text-[var(--muted-text)] italic">No key concepts generated yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {generatedKeyConcepts.map((item, idx) => (
                        <li key={idx} className="text-xs text-[var(--foreground)] flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] text-[var(--muted-text)]">
              * Note: Only lessons published by the Admin are visible to students enrolled in the corresponding course.
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. CODING & HARDWARE LAB MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'labs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Lab Form */}
          <div className="lg:col-span-1 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Create Practical Lab</h3>
            <form onSubmit={handleCreateLab} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Lab Title</label>
                <input
                  type="text"
                  required
                  value={labTitle}
                  onChange={(e) => setLabTitle(e.target.value)}
                  placeholder="e.g. Arduino Ultrasonic Distance Radar"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Hardware Board</label>
                <select
                  value={labBoard}
                  onChange={(e) => setLabBoard(e.target.value as HardwareBoard)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                >
                  <option value="esp32">ESP32 (Wi-Fi + BLE Dual Core)</option>
                  <option value="arduino_uno">Arduino Uno (ATmega328P)</option>
                  <option value="rp2040_pico">Raspberry Pi Pico (RP2040)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Max Score</label>
                <input
                  type="number"
                  value={labMarks}
                  onChange={(e) => setLabMarks(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Lab Instructions</label>
                <textarea
                  value={labDesc}
                  onChange={(e) => setLabDesc(e.target.value)}
                  rows={3}
                  placeholder="Instructions for students regarding pin connections and expected serial output..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-semibold transition cursor-pointer"
              >
                Create Hardware Lab
              </button>
            </form>
          </div>

          {/* List of Active Labs */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Active Curriculum Labs ({labsList.length})</h3>
            <div className="space-y-3">
              {labsList.map((lab) => (
                <div key={lab.id} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-secondary)] font-bold uppercase text-[10px]">
                      {lab.board}
                    </span>
                    <span className="font-semibold text-[var(--muted-text)]">{lab.marks} Marks</span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--foreground)]">{lab.title}</h4>
                  <p className="text-xs text-[var(--muted-text)]">{lab.description}</p>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                    <code>{lab.startingCode}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. TESTS & QUIZZES */}
      {/* ==================================================== */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Create Course Examination</h3>
            <form onSubmit={handleCreateTestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Test Title</label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Module 1: Circuit Analysis Midterm"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Pass Score (%)</label>
                  <input
                    type="number"
                    value={testPassingScore}
                    onChange={(e) => setTestPassingScore(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={testDuration}
                    onChange={(e) => setTestDuration(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Question 1</label>
                <input
                  type="text"
                  value={testQ1}
                  onChange={(e) => setTestQ1(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)] mb-1.5"
                />
                <label className="block text-[11px] text-[var(--muted-text)] mb-1">Options (comma separated)</label>
                <input
                  type="text"
                  value={testQ1Opt}
                  onChange={(e) => setTestQ1Opt(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)] mb-1.5"
                />
                <label className="block text-[11px] text-[var(--muted-text)] mb-1">Correct Answer</label>
                <input
                  type="text"
                  value={testQ1Ans}
                  onChange={(e) => setTestQ1Ans(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-semibold transition cursor-pointer"
              >
                Publish Test
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Configured Tests ({tests.length})</h3>
            <div className="space-y-3">
              {tests.map((t) => (
                <div key={t.id} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--foreground)]">{t.title}</span>
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--foreground)] text-[10px] font-semibold">
                      Pass: {t.passingScore}% • {t.durationMinutes} min
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-text)]">{t.instructions}</p>
                  <p className="text-[11px] text-[var(--muted-text)]">{t.questions.length} Question(s) attached.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. ASSIGNMENTS */}
      {/* ==================================================== */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Create Practical Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="e.g. Build an ESP32 Temperature Monitor"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Max Marks</label>
                <input
                  type="number"
                  value={assignmentMarks}
                  onChange={(e) => setAssignmentMarks(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Problem Statement</label>
                <textarea
                  required
                  value={assignmentDesc}
                  onChange={(e) => setAssignmentDesc(e.target.value)}
                  rows={4}
                  placeholder="Describe circuit schematics, expected timing, firmware requirements..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-semibold transition cursor-pointer"
              >
                Create Assignment
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Student Submissions ({submissions.length})</h3>
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted-text)] bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                No coursework submissions from students yet.
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-[var(--foreground)]">{sub.studentName}</strong>
                        <span className="text-[var(--muted-text)] ml-2 font-mono text-[10px]">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.status === 'reviewed' ? `Graded: ${sub.marks || 0}` : 'Needs Review'}
                      </span>
                    </div>
                    <div className="p-3 bg-[var(--surface-secondary)] rounded-lg text-xs text-[var(--foreground)] whitespace-pre-wrap border border-[var(--border)]">
                      {sub.content}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          const grade = prompt('Enter grade marks (e.g. 95):', sub.marks?.toString() || '95');
                          if (grade) {
                            const feedback = prompt('Enter mentor feedback:', sub.feedback || 'Excellent circuit design!');
                            gradeSubmission(sub.id, parseInt(grade, 10), feedback || '');
                            showToast('Submission reviewed and graded!');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-semibold"
                      >
                        Grade & Provide Feedback
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. STUDENTS & COURSE ACCESS KEYS */}
      {/* ==================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Key Generator Tool */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                Instant Course Access Key Generator
              </h3>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Generate secure keys to give students instant authorization to courses.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={newKeyCourseId}
                onChange={(e) => setNewKeyCourseId(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerateKey}
                className="px-3 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Key</span>
              </button>
            </div>
          </div>

          {/* Student Search and Table */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                Authorized Students Directory ({authorizedStudents.length})
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--muted-text)]" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Filter students..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted-text)] font-semibold">
                    <th className="pb-2.5">Student</th>
                    <th className="pb-2.5">Course Assigned</th>
                    <th className="pb-2.5">Access Status</th>
                    <th className="pb-2.5">Enrollment Key</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3">
                        <p className="font-bold text-[var(--foreground)]">{s.name}</p>
                        <p className="text-[11px] text-[var(--muted-text)]">{s.email}</p>
                      </td>
                      <td className="py-3 text-[var(--foreground)] max-w-[200px] truncate">{s.courseTitle || 'Electronics Fundamentals'}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {s.status === 'authorized' ? '✓ Authorized' : s.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-[var(--muted-text)]">
                        {s.courseKey ? (
                          <button
                            onClick={() => handleCopyText(s.courseKey || '')}
                            className="flex items-center gap-1 hover:text-[var(--foreground)] cursor-pointer"
                          >
                            <span>{s.courseKey}</span>
                            <Copy className="w-3 h-3" />
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Remove student ${s.name}?`)) {
                              deleteStudentRequest(s.id);
                              showToast('Student removed.');
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 8. STEM SHOP & PRODUCTS (Admin is Seller) */}
      {/* ==================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">STEM Hardware Catalog & Inventory</h3>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                The platform administrator directly controls all hardware products, pricing, stock levels, and kits.
              </p>
            </div>
            <button
              onClick={() => setProdModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add STEM Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
                <div className="aspect-video w-full rounded-lg bg-[var(--surface-secondary)] overflow-hidden relative">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-white font-bold text-[10px]">
                    Stock: {p.stock}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[var(--muted-text)]">{p.category}</span>
                    <span className="text-sm font-bold font-mono text-[var(--foreground)]">${p.price.toFixed(2)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--foreground)] tracking-tight mt-0.5">{p.title}</h4>
                  <p className="text-xs text-[var(--muted-text)] line-clamp-2 mt-1">{p.description}</p>
                </div>
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <button
                    onClick={() => {
                      const newQty = prompt('Update stock count:', p.stock.toString());
                      if (newQty) {
                        updateProduct(p.id, { stock: parseInt(newQty, 10) || 0 });
                        showToast('Stock level updated.');
                      }
                    }}
                    className="text-xs font-semibold text-[var(--foreground)] hover:underline"
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Disable product ${p.title}?`)) {
                        updateProduct(p.id, { status: 'disabled' });
                        showToast('Product disabled.');
                      }
                    }}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 9. ORDERS */}
      {/* ==================================================== */}
      {activeTab === 'orders' && (
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Student Hardware Orders</h3>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Review and update shipping fulfillment status (Processing, Shipped, Delivered).
              </p>
            </div>
            <span className="text-xs text-[var(--muted-text)]">{orders.length} total orders</span>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-[var(--muted-text)] py-6 text-center">No orders currently placed.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-mono text-[var(--foreground)]">{ord.orderId}</strong>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-[var(--foreground)] text-[10px] font-bold">
                        {ord.orderStatus}
                      </span>
                    </div>
                    <p className="text-[var(--muted-text)]">
                      Deliver to: <strong>{ord.shippingAddress.fullName}</strong> • {ord.shippingAddress.addressLine},{' '}
                      {ord.shippingAddress.city} ({ord.shippingAddress.postalCode})
                    </p>
                    <p className="text-[11px] text-[var(--muted-text)]">
                      Phone: {ord.shippingAddress.phone} • Email: {ord.shippingAddress.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold font-mono text-[var(--foreground)] text-sm">${ord.totalAmount.toFixed(2)}</p>
                      <p className="text-[10px] text-[var(--muted-text)]">{ord.items.length} item(s)</p>
                    </div>

                    <select
                      value={ord.orderStatus}
                      onChange={(e) => {
                        updateOrderStatusBySeller(ord.id, e.target.value as OrderStatus, undefined, 'InnoLink Logistics', `Status updated by Admin`);
                        showToast(`Order status updated to ${e.target.value}`);
                      }}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] font-semibold"
                    >
                      <option value="PROCESSING">Processing</option>
                      <option value="PACKED">Packed</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 10. PAYMENTS */}
      {/* ==================================================== */}
      {activeTab === 'payments' && (
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Platform Payments & Transaction Records</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
            <div className="p-3.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[11px] font-semibold text-[var(--muted-text)] block">Total Collected</span>
              <span className="text-xl font-bold font-mono text-[var(--foreground)]">${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[11px] font-semibold text-[var(--muted-text)] block">Course Enrollments</span>
              <span className="text-xl font-bold font-mono text-[var(--foreground)]">{authorizedStudents.length}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[11px] font-semibold text-[var(--muted-text)] block">Hardware Kit Orders</span>
              <span className="text-xl font-bold font-mono text-[var(--foreground)]">{orders.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted-text)] font-semibold">
                  <th className="pb-2">Transaction ID</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Customer / Student</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-2.5 font-mono text-[var(--foreground)]">{ord.orderId}</td>
                    <td className="py-2.5 text-[var(--muted-text)]">STEM Kit Order</td>
                    <td className="py-2.5 font-medium text-[var(--foreground)]">{ord.shippingAddress.fullName}</td>
                    <td className="py-2.5 font-bold font-mono text-[var(--foreground)]">${ord.totalAmount.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">VERIFIED</td>
                  </tr>
                ))}
                {authorizedStudents.map((stu) => (
                  <tr key={stu.id}>
                    <td className="py-2.5 font-mono text-[var(--foreground)]">ENROLL_{stu.id.slice(-6)}</td>
                    <td className="py-2.5 text-[var(--muted-text)]">Course Enrollment</td>
                    <td className="py-2.5 font-medium text-[var(--foreground)]">{stu.name}</td>
                    <td className="py-2.5 font-bold font-mono text-[var(--foreground)]">$99.99</td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">PAID & AUTHORIZED</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 11. ANALYTICS */}
      {/* ==================================================== */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Learning Completion Rates</h3>
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Electronics Fundamentals</span>
                  <span>92% Completed</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                  <div className="w-[92%] h-full bg-slate-900 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>ESP32 IoT & Embedded Systems</span>
                  <span>78% Completed</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                  <div className="w-[78%] h-full bg-slate-900 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>ARM Cortex-M Firmware</span>
                  <span>64% Completed</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                  <div className="w-[64%] h-full bg-slate-900 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Hardware Lab Activity</h3>
            <div className="space-y-3 pt-2 text-xs text-[var(--muted-text)]">
              <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex justify-between items-center">
                <span>Total Simulator Compilations</span>
                <strong className="text-[var(--foreground)] font-mono text-sm">1,482 runs</strong>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex justify-between items-center">
                <span>Average Test Score</span>
                <strong className="text-[var(--foreground)] font-mono text-sm">88.4%</strong>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex justify-between items-center">
                <span>Average Student Watch Time</span>
                <strong className="text-[var(--foreground)] font-mono text-sm">42 mins / session</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 13. TERMS & CONDITIONS MANAGEMENT (Owner Managed) */}
      {/* ==================================================== */}
      {activeTab === 'terms' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--foreground)]">Platform Terms & Conditions</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Version {termsVersion}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${termsPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {termsPublished ? '✓ Published' : 'Draft'}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Manage the platform agreement required for students. When you publish a new version, students will be prompted to accept the updated terms.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTermsPreviewOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                disabled={termsSaving}
                onClick={() => handleSaveTerms(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                disabled={termsSaving}
                onClick={() => handleSaveTerms(true)}
                className="px-4 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish Version {termsPublished ? termsVersion + 1 : termsVersion}</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            {/* Formatting Toolbar */}
            <div className="flex items-center flex-wrap gap-1.5 pb-3 border-b border-[var(--border)] text-xs">
              <span className="text-[11px] text-[var(--muted-text)] mr-2 font-medium">Insert Formatting:</span>
              <button
                type="button"
                onClick={() => setTermsContent((prev) => prev + '\n\n## Section Title\n')}
                className="px-2 py-1 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/80 text-[11px] font-semibold cursor-pointer"
              >
                Heading
              </button>
              <button
                type="button"
                onClick={() => setTermsContent((prev) => prev + '\n\n### Subheading\n')}
                className="px-2 py-1 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/80 text-[11px] font-semibold cursor-pointer"
              >
                Subheading
              </button>
              <button
                type="button"
                onClick={() => setTermsContent((prev) => prev + ' **bold text**')}
                className="px-2 py-1 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/80 text-[11px] font-bold cursor-pointer"
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => setTermsContent((prev) => prev + ' *italic text*')}
                className="px-2 py-1 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/80 text-[11px] italic cursor-pointer"
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => setTermsContent((prev) => prev + '\n1. First item\n2. Second item\n3. Third item\n')}
                className="px-2 py-1 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/80 text-[11px] cursor-pointer"
              >
                Numbered List
              </button>
              <button
                type="button"
                onClick={() => setTermsContent((prev) => prev + '\n• Bullet point 1\n• Bullet point 2\n')}
                className="px-2 py-1 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/80 text-[11px] cursor-pointer"
              >
                Bullet List
              </button>
            </div>

            {/* Text Editor Area */}
            <div>
              <textarea
                rows={16}
                value={termsContent}
                onChange={(e) => setTermsContent(e.target.value)}
                placeholder="Enter Terms & Conditions content here..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/60 p-4 font-mono text-xs sm:text-sm text-[var(--foreground)] leading-relaxed focus:border-[var(--foreground)] focus:outline-none resize-y"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--muted-text)] pt-1">
              <span>Last updated: {termsUpdatedAt ? new Date(termsUpdatedAt).toLocaleString() : 'Just now'}</span>
              <span>Author: {termsUpdatedBy}</span>
            </div>
          </div>

          {/* Terms Preview Modal */}
          <TermsModal
            isOpen={termsPreviewOpen}
            onClose={() => setTermsPreviewOpen(false)}
            terms={{
              content: termsContent,
              version: termsVersion,
              published: termsPublished,
              updatedAt: termsUpdatedAt || new Date().toISOString(),
              updatedBy: termsUpdatedBy,
            }}
            isAcceptanceRequired={false}
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* 12. SETTINGS & BRANDING MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          {/* SECTION 1: BRANDING & IDENTITY */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[var(--foreground)]" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Platform Branding & Identity</h3>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">
                    Customize platform name, logos, accent colors, and contact info globally without editing code.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetBranding}
                className="px-2.5 py-1 text-xs border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Defaults</span>
              </button>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Full Platform Name</label>
                  <input
                    type="text"
                    required
                    value={brandingForm.platformName}
                    onChange={(e) => setBrandingForm({ ...brandingForm, platformName: e.target.value })}
                    placeholder="InnoLink Technologies"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)] focus:bg-[var(--surface)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Short Brand Name (Navbar)</label>
                  <input
                    type="text"
                    required
                    value={brandingForm.shortName}
                    onChange={(e) => setBrandingForm({ ...brandingForm, shortName: e.target.value })}
                    placeholder="InnoLink"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)] focus:bg-[var(--surface)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Logo Upload & Aspect Ratio Handling */}
              <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-[var(--foreground)]">Platform Logo (SVG / PNG / WebP)</label>
                  <span className="text-[10px] text-[var(--muted-text)]">Auto aspect-ratio preservation (object-contain)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview Box */}
                  <div className="h-16 w-36 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 flex items-center justify-center shrink-0 shadow-xs">
                    {brandingForm.logoUrl ? (
                      <img
                        src={brandingForm.logoUrl}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-[var(--muted-text)] font-mono text-center">No custom logo (Icon used)</span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-xs text-[var(--muted-text)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingForm.logoUrl}
                      onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                      placeholder="Or enter direct image/SVG URL (https://...)"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 text-xs text-[var(--foreground)]"
                    />
                  </div>
                </div>
              </div>

              {/* Accent Color Palette Selector */}
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1.5">Primary Accent Color</label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'Emerald', hex: '#10B981' },
                    { label: 'Blue', hex: '#2563EB' },
                    { label: 'Violet', hex: '#7C3AED' },
                    { label: 'Amber', hex: '#D97706' },
                    { label: 'Rose', hex: '#E11D48' },
                    { label: 'Slate', hex: '#0F172A' },
                  ].map((clr) => (
                    <button
                      key={clr.hex}
                      type="button"
                      onClick={() => setBrandingForm({ ...brandingForm, primaryAccent: clr.hex })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                        brandingForm.primaryAccent?.toLowerCase() === clr.hex.toLowerCase()
                          ? 'border-slate-900 bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                          : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: clr.hex }} />
                      <span>{clr.label}</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px] text-[var(--muted-text)]">Custom:</span>
                    <input
                      type="color"
                      value={brandingForm.primaryAccent || '#10B981'}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primaryAccent: e.target.value })}
                      className="w-7 h-7 rounded border border-[var(--border)] cursor-pointer p-0.5"
                    />
                    <span className="font-mono text-[11px] text-[var(--muted-text)]">{brandingForm.primaryAccent}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Platform Description</label>
                <textarea
                  rows={2}
                  value={brandingForm.brandDescription}
                  onChange={(e) => setBrandingForm({ ...brandingForm, brandDescription: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)] focus:bg-[var(--surface)] focus:outline-none"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={brandingForm.contactEmail}
                    onChange={(e) => setBrandingForm({ ...brandingForm, contactEmail: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={brandingForm.contactPhone}
                    onChange={(e) => setBrandingForm({ ...brandingForm, contactPhone: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Powered By Attribution</label>
                  <input
                    type="text"
                    value={brandingForm.poweredBy}
                    onChange={(e) => setBrandingForm({ ...brandingForm, poweredBy: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Official Address</label>
                <input
                  type="text"
                  value={brandingForm.address}
                  onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Live Preview</span>
                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {brandingForm.logoUrl ? (
                      <img src={brandingForm.logoUrl} alt="Preview" className="h-6 w-auto object-contain" />
                    ) : (
                      <div
                        className="h-6 w-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: brandingForm.primaryAccent || '#10B981' }}
                      >
                        ✓
                      </div>
                    )}
                    <span className="font-bold text-[var(--foreground)]">{brandingForm.platformName}</span>
                  </div>
                  <span className="text-[11px] text-[var(--muted-text)]">Header Preview</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  Save Platform Branding
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: OWNER SECURITY & CREDENTIALS CHANGE */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Owner Security & Credentials</h3>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Change your login credentials protected by the 5-digit Master PIN and Firebase Authentication.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)] space-y-1">
              <p>
                <strong>Authorized Account:</strong> {currentUser?.email || 'kkscreative@innolink.tech'}
              </p>
              <p>
                <strong>Access Level:</strong> Platform Owner & Curriculum Supervisor
              </p>
            </div>

            <form onSubmit={handleUpdateOwnerCredentials} className="space-y-3.5 text-xs max-w-md">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Master PIN</label>
                <div className="relative">
                  <input
                    type={showMasterPin ? 'text' : 'password'}
                    required
                    maxLength={5}
                    value={masterPin}
                    onChange={(e) => setMasterPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="•••••"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 pr-9 text-[var(--foreground)] font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPin(!showMasterPin)}
                    className="absolute right-2.5 top-2.5 text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
                  >
                    {showMasterPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--muted-text)] mt-0.5">5-digit numeric security PIN required to authorize credential changes.</p>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">New Username / Email</label>
                <input
                  type="text"
                  value={newOwnerUsername}
                  onChange={(e) => setNewOwnerUsername(e.target.value)}
                  placeholder="e.g. KKSCREATIVE or owner@innolink.tech"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewOwnerPassword ? 'text' : 'password'}
                    required
                    value={newOwnerPassword}
                    onChange={(e) => setNewOwnerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 pr-9 text-[var(--foreground)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewOwnerPassword(!showNewOwnerPassword)}
                    className="absolute right-2.5 top-2.5 text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
                  >
                    {showNewOwnerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmOwnerPassword ? 'text' : 'password'}
                    required
                    value={confirmOwnerPassword}
                    onChange={(e) => setConfirmOwnerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 pr-9 text-[var(--foreground)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmOwnerPassword(!showConfirmOwnerPassword)}
                    className="absolute right-2.5 top-2.5 text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
                  >
                    {showConfirmOwnerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={credChangeLoading}
                className="w-full py-2.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50 text-[var(--background)] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {credChangeLoading ? 'Verifying & Updating...' : 'Update Credentials'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE COURSE */}
      {/* ---------------------------------------------------- */}
      {newCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--foreground)]">Create New Course</h3>
            <form onSubmit={handleCreateCourseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="e.g. Advanced Robotics with ROS2 & ESP32"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Course Description</label>
                <textarea
                  required
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newCoursePrice}
                    onChange={(e) => setNewCoursePrice(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Discipline Category</label>
                  <input
                    type="text"
                    value={newCourseCategory}
                    onChange={(e) => setNewCourseCategory(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCourseModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-semibold"
                >
                  Save & Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD STEM PRODUCT */}
      {/* ---------------------------------------------------- */}
      {prodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--foreground)]">Add STEM Product / Kit</h3>
            <form onSubmit={handleCreateProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="e.g. InnoLink ESP32 Dual-Core IoT Starter Kit"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Platform</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                  >
                    <option value="esp32">ESP32</option>
                    <option value="arduino">Arduino</option>
                    <option value="pico">Pico</option>
                    <option value="robotics">Robotics</option>
                    <option value="sensors">Sensors</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Description</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Included Components (comma separated)</label>
                <input
                  type="text"
                  value={prodComponents}
                  onChange={(e) => setProdComponents(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-[var(--foreground)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProdModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-semibold"
                >
                  Save & List in Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
