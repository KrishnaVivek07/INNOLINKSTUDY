import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { useBranding } from '../context/BrandingContext';
import { CodingLabAccessGate } from '../components/lab/CodingLabAccessGate';
import { CodeEditor } from '../components/lab/CodeEditor';
import { BlocklyEditor, ElectronicsBlock } from '../components/lab/BlocklyEditor';
import { HybridEditor } from '../components/lab/HybridEditor';
import { VirtualHardwareWorkspace } from '../components/lab/VirtualHardwareWorkspace';
import { BOARD_REGISTRY } from '../lib/boardRegistry';
import {
  HardwareBoard,
  CodingLabLanguage,
  CodingLab,
  SimulatedComponent,
  LabSubmission,
} from '../types';
import {
  Cpu,
  Layers,
  Code,
  FileCode,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Send,
  Save,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  AlertCircle,
  HelpCircle,
  Plus,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';

const INITIAL_COURSE_LABS: CodingLab[] = [
  {
    id: 'lab-esp32-1',
    courseId: 'course-electronics-core',
    title: 'Lab 1: Dual LED Blink & PWM Fading',
    description: 'Configure ESP32 GPIO pins to blink external LEDs and generate PWM analog fading signals.',
    board: 'esp32',
    language: 'arduino_c',
    requiredComponents: ['ESP32 NodeMCU', 'Red 5mm LED', '220Ω Resistor', 'Breadboard'],
    recommendedKitId: 'stem-kit-esp32-starter',
    instructions: `1. Connect LED Anode (+) to GPIO 2 via a 220Ω current-limiting resistor.\n2. Connect LED Cathode (-) to GND.\n3. Write an Arduino sketch initializing GPIO 2 as an OUTPUT.\n4. Alternate HIGH (3.3V) and LOW (0V) with 1000ms delay intervals.`,
    expectedOutput: 'Built-in and external LED toggles every 1.0 second with serial logging.',
    marks: 100,
    attemptsAllowed: 5,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lab-arduino-2',
    courseId: 'course-electronics-core',
    title: 'Lab 2: Ultrasonic Distance Detector with Buzzer Alert',
    description: 'Interface the HC-SR04 ultrasonic transducer with Arduino Uno to trigger audio warning beeps when an obstacle is within 20cm.',
    board: 'arduino_uno',
    language: 'arduino_c',
    requiredComponents: ['Arduino Uno R3', 'HC-SR04 Ultrasonic Sensor', '5V Buzzer', 'Jumper Wires'],
    recommendedKitId: 'stem-kit-arduino-robotics',
    instructions: `1. Connect Trig to Pin 9 and Echo to Pin 10.\n2. Connect Buzzer positive terminal to Pin 8 and negative to GND.\n3. Trigger high pulse for 10 microseconds on Trig.\n4. Measure echo duration and calculate distance in cm: (duration * 0.034) / 2.\n5. If distance < 20cm, set Pin 8 HIGH.`,
    expectedOutput: 'Serial monitor outputs distance in cm; buzzer beeps when distance is under 20cm.',
    marks: 100,
    attemptsAllowed: 5,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lab-pico-3',
    courseId: 'course-electronics-core',
    title: 'Lab 3: Raspberry Pi Pico Analog Potentiometer & RGB Light Bar',
    description: 'Sample 12-bit analog voltages on RP2040 GP26 (ADC0) and scale the reading to dynamic RGB LED illumination.',
    board: 'rp2040_pico',
    language: 'arduino_c',
    requiredComponents: ['Raspberry Pi Pico RP2040', '10kΩ Potentiometer', 'RGB LED', 'Resistors'],
    recommendedKitId: 'stem-kit-pico-microcontroller',
    instructions: `1. Connect center wiper of 10k potentiometer to Pico GP26 (ADC0).\n2. Connect outer pins to 3V3 and GND.\n3. Read analog voltage using ADC conversion.\n4. Print raw voltage and scale to RGB output.`,
    expectedOutput: 'Continuous potentiometer voltage logged to serial console.',
    marks: 100,
    attemptsAllowed: 5,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
];

interface CodingLabPageProps {
  initialCourseId?: string;
  onNavigateToCourse?: (courseId: string) => void;
  onNavigateToMarketplaceKit?: (kitId: string) => void;
}

export const CodingLabPage: React.FC<CodingLabPageProps> = ({
  initialCourseId = 'course-electronics-core',
  onNavigateToCourse,
  onNavigateToMarketplaceKit,
}) => {
  const { currentUser, role } = useAuth();
  const { courses } = useLMS();
  const { branding } = useBranding();

  const isMentor = role === 'admin';
  const selectedCourse = courses.find((c) => c.id === initialCourseId) || courses[0];

  // Coding Labs state
  const [labs, setLabs] = useState<CodingLab[]>(() => {
    try {
      const saved = localStorage.getItem('innolink_coding_labs');
      return saved ? JSON.parse(saved) : INITIAL_COURSE_LABS;
    } catch {
      return INITIAL_COURSE_LABS;
    }
  });

  const [activeLabId, setActiveLabId] = useState<string>(labs[0]?.id || 'lab-esp32-1');
  const currentLab = labs.find((l) => l.id === activeLabId) || labs[0];

  // Active hardware board & coding mode
  const [selectedBoard, setSelectedBoard] = useState<HardwareBoard>(currentLab?.board || 'esp32');
  const [editorMode, setEditorMode] = useState<CodingLabLanguage>('arduino_c');

  const boardDef = BOARD_REGISTRY[selectedBoard] || BOARD_REGISTRY.arduino_uno;

  // Code state
  const [code, setCode] = useState<string>(
    `// ${branding.platformName} - ${currentLab?.title || 'Electronics Lab'}
#define LED_PIN 2

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("${branding.shortName || 'InnoLink'} Hardware Lab Initialized!");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON (GPIO 2)");
  delay(1000);

  digitalWrite(LED_PIN, LOW);
  Serial.println("LED OFF (GPIO 2)");
  delay(1000);
}`
  );

  // Blocks state
  const [blocks, setBlocks] = useState<ElectronicsBlock[]>([
    { id: 'b1', category: 'output', type: 'pin_mode', label: 'Configure Pin as OUTPUT', params: { pin: '2', mode: 'OUTPUT' } },
    { id: 'b2', category: 'communication', type: 'serial_begin', label: 'Initialize Serial Monitor', params: { baud: 115200 } },
    { id: 'b3', category: 'output', type: 'digital_write', label: 'Set Digital Pin State', params: { pin: '2', state: 'HIGH' } },
    { id: 'b4', category: 'logic', type: 'wait', label: 'Wait Milliseconds', params: { ms: 1000 } },
    { id: 'b5', category: 'output', type: 'digital_write', label: 'Set Digital Pin State', params: { pin: '2', state: 'LOW' } },
    { id: 'b6', category: 'logic', type: 'wait', label: 'Wait Milliseconds', params: { ms: 1000 } },
  ]);

  // Hardware components state
  const [components, setComponents] = useState<SimulatedComponent[]>([
    {
      id: 'c1',
      type: 'led',
      label: 'Red 5mm LED',
      color: 'red',
      state: { pin: '2', digitalValue: false },
      pins: { anode: '2', cathode: 'GND' },
    },
    {
      id: 'c2',
      type: 'push_button',
      label: 'Digital Push Button',
      state: { pin: '4', digitalValue: false },
      pins: { signal: '4', gnd: 'GND' },
    },
  ]);

  // Simulation execution & serial state
  const [isSimulating, setIsSimulating] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const simTimerRef = useRef<any>(null);

  // Submission & Saved Projects state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync labs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('innolink_coding_labs', JSON.stringify(labs));
    } catch {
      // quota fallback
    }
  }, [labs]);

  // When active lab changes, update board and instructions
  const handleSelectLab = (labId: string) => {
    setActiveLabId(labId);
    const target = labs.find((l) => l.id === labId);
    if (target) {
      setSelectedBoard(target.board);
      if (target.startingCode) setCode(target.startingCode);
    }
  };

  // Run Simulation logic
  const handleRunSimulation = () => {
    setIsSimulating(true);
    const timestamp = new Date().toLocaleTimeString();
    setSerialLogs((prev) => [
      ...prev,
      `[${timestamp}] Booting ${boardDef.name} (${boardDef.mcu})...`,
      `[${timestamp}] Clock: ${boardDef.clockSpeed} • Logic Voltage: ${boardDef.operatingVoltage}`,
      `[${timestamp}] GPIO configured. Running loop()...`,
    ]);

    if (simTimerRef.current) clearInterval(simTimerRef.current);
    let step = 0;
    simTimerRef.current = setInterval(() => {
      step++;
      const isHigh = step % 2 === 1;
      setComponents((prev) =>
        prev.map((c) =>
          c.type === 'led' ? { ...c, state: { ...c.state, digitalValue: isHigh } } : c
        )
      );

      setSerialLogs((prev) => {
        const next = [
          ...prev,
          `[Signal] Pin ${selectedBoard === 'esp32' ? '2' : '13'} -> ${isHigh ? 'HIGH' : 'LOW'}`,
        ];
        return next.slice(-40);
      });
    }, 1000);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setSerialLogs((prev) => [...prev, `[Halt] Virtual microcontroller halted.`]);
  };

  const handleResetSimulation = () => {
    handleStopSimulation();
    setSerialLogs([]);
    setComponents((prev) =>
      prev.map((c) => ({
        ...c,
        state: { ...c.state, digitalValue: false },
      }))
    );
  };

  // Save student project locally
  const handleSaveProject = () => {
    const project = {
      board: selectedBoard,
      code,
      blocks,
      components,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`innolink_student_project_${currentLab.id}`, JSON.stringify(project));
      showToast('Project progress saved locally!');
    } catch {
      showToast('Failed to save project.');
    }
  };

  // Load student project
  const handleLoadProject = () => {
    try {
      const saved = localStorage.getItem(`innolink_student_project_${currentLab.id}`);
      if (saved) {
        const proj = JSON.parse(saved);
        if (proj.board) setSelectedBoard(proj.board);
        if (proj.code) setCode(proj.code);
        if (proj.blocks) setBlocks(proj.blocks);
        if (proj.components) setComponents(proj.components);
        showToast('Saved project loaded!');
      } else {
        showToast('No saved project found for this lab.');
      }
    } catch {
      showToast('Error loading project.');
    }
  };

  // Submit lab project
  const handleSubmitProject = () => {
    const newSubmission: LabSubmission = {
      id: `sub_lab_${Date.now()}`,
      labId: currentLab.id,
      courseId: currentLab.courseId,
      studentId: currentUser?.uid || 'student_demo',
      studentName: currentUser?.displayName || 'Student Scholar',
      board: selectedBoard as HardwareBoard,
      code,
      simulationLog: serialLogs.slice(-10).join('\n'),
      status: 'submitted',
      marks: undefined,
      submittedAt: new Date().toISOString(),
    };

    try {
      const savedSubs = localStorage.getItem('innolink_lab_submissions');
      const subs: LabSubmission[] = savedSubs ? JSON.parse(savedSubs) : [];
      localStorage.setItem('innolink_lab_submissions', JSON.stringify([newSubmission, ...subs]));
    } catch {
      // fallback
    }

    setSubmissionSuccess(`Lab project "${currentLab.title}" submitted successfully for mentor verification.`);
    setTimeout(() => {
      setSubmitModalOpen(false);
      setSubmissionSuccess(null);
    }, 1800);
  };

  return (
    <CodingLabAccessGate
      courseId={selectedCourse?.id || 'course-electronics-core'}
      courseTitle={selectedCourse?.title}
      onViewCourses={() => onNavigateToCourse?.(selectedCourse?.id || 'course-electronics-core')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 text-[var(--foreground)] bg-[var(--background)] transition-colors duration-200">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-3 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold shadow-xl">
            {toastMessage}
          </div>
        )}

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
                Virtual Laboratory
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
              {currentLab?.title || 'Interactive Electronics & Coding Lab'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-0.5">
              Build, program, simulate, and verify circuits on Arduino, ESP32, and Raspberry Pi Pico.
            </p>
          </div>

          {/* Controls: Mode Switcher + Project Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Editor Mode Switcher */}
            <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)] shadow-xs">
              <button
                type="button"
                onClick={() => setEditorMode('arduino_c')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  editorMode === 'arduino_c'
                    ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                    : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>C++ / Code</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('blocks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  editorMode === 'blocks'
                    ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                    : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Visual Blocks</span>
              </button>
            </div>

            {/* Project Save / Load */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSaveProject}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] text-xs transition cursor-pointer shadow-xs"
                title="Save Project Progress"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleLoadProject}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] text-xs transition cursor-pointer shadow-xs"
                title="Load Saved Project"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>

            {/* Submit Project Button */}
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Lab</span>
            </button>
          </div>
        </div>

        {/* Course Labs Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Labs:</span>
          </span>
          {labs.map((lab) => (
            <button
              key={lab.id}
              type="button"
              onClick={() => handleSelectLab(lab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition cursor-pointer border ${
                activeLabId === lab.id
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-semibold'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              {lab.title}
            </button>
          ))}
        </div>

        {/* Main Grid: Code / Blocks Area on Left, Hardware Simulation on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Code / Blocks Workspace */}
          <div className="lg:col-span-6 space-y-4">
            {editorMode === 'arduino_c' && (
              <CodeEditor
                board={selectedBoard}
                code={code}
                onChangeCode={setCode}
                onRunSimulation={handleRunSimulation}
                onStopSimulation={handleStopSimulation}
                onResetSimulation={handleResetSimulation}
                isSimulating={isSimulating}
              />
            )}

            {editorMode === 'blocks' && (
              <BlocklyEditor
                board={selectedBoard}
                blocks={blocks}
                onChangeBlocks={setBlocks}
                onGenerateCode={(generated) => setCode(generated)}
              />
            )}

            {/* Lab Instructions & Checklist */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[var(--muted-text)]" />
                <span>Lab Instructions & Requirements</span>
              </h3>
              <p className="text-xs text-[var(--muted-text)] whitespace-pre-line leading-relaxed font-sans">
                {currentLab.instructions}
              </p>
              <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between text-xs text-[var(--muted-text)]">
                <span>Expected Output: {currentLab.expectedOutput}</span>
                <span className="font-semibold font-mono text-[var(--foreground)]">Marks: {currentLab.marks} pts</span>
              </div>
            </div>
          </div>

          {/* Right Column: Virtual Hardware & Circuit Simulation */}
          <div className="lg:col-span-6 space-y-4">
            <VirtualHardwareWorkspace
              board={selectedBoard}
              onChangeBoard={(newB) => setSelectedBoard(newB)}
              components={components}
              onUpdateComponents={setComponents}
              isSimulating={isSimulating}
              onToggleSimulation={isSimulating ? handleStopSimulation : handleRunSimulation}
              onResetSimulation={handleResetSimulation}
              serialLogs={serialLogs}
              onClearSerial={() => setSerialLogs([])}
              onSendSerialInput={(input) => {
                setSerialLogs((prev) => [
                  ...prev,
                  `> [INPUT] ${input}`,
                  `[${boardDef.name}] Processed command: ${input}`,
                ]);
              }}
              recommendedKitId={currentLab.recommendedKitId}
              onNavigateToMarketplaceKit={onNavigateToMarketplaceKit}
            />
          </div>
        </div>

        {/* Submit Project Modal */}
        {submitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--foreground)] shadow-xl space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Send className="w-5 h-5" />
                <span>Submit Lab Project for Verification</span>
              </h3>

              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                Your program code, circuit components, and simulation logs will be submitted to the Faculty Mentor for review.
              </p>

              <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1 font-mono text-xs">
                <div>Lab: <span className="font-sans font-medium text-[var(--foreground)]">{currentLab.title}</span></div>
                <div>Board: <span className="uppercase font-semibold text-[var(--foreground)]">{boardDef.name}</span></div>
                <div>Student: <span className="font-sans text-[var(--foreground)]">{currentUser?.displayName}</span></div>
                <div>Code length: <span>{code.length} characters</span></div>
              </div>

              {submissionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{submissionSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-secondary)] text-xs text-[var(--foreground)] transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitProject}
                  className="px-5 py-2 rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium text-xs transition cursor-pointer shadow-xs hover:opacity-90"
                >
                  Confirm Submission
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CodingLabAccessGate>
  );
};
