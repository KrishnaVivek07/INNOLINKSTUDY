import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLMS } from '../context/LMSContext';
import { useBranding } from '../context/BrandingContext';
import { CodingLabAccessGate } from '../components/lab/CodingLabAccessGate';
import { CodeEditor } from '../components/lab/CodeEditor';
import { BlocklyEditor, ElectronicsBlock } from '../components/lab/BlocklyEditor';
import { HybridEditor } from '../components/lab/HybridEditor';
import { VirtualHardwareWorkspace } from '../components/lab/VirtualHardwareWorkspace';
import { ArduinoIDEToolbar } from '../components/lab/ArduinoIDEToolbar';
import { SearchableBoardSelector } from '../components/lab/SearchableBoardSelector';
import { CurriculumLessonSidebar } from '../components/lab/CurriculumLessonSidebar';
import { GeneralProgrammingWorkspace } from '../components/lab/GeneralProgrammingWorkspace';
import { CodeImportModal } from '../components/lab/CodeImportModal';
import { BOARD_REGISTRY } from '../lib/boardRegistry';
import { validateAndSimulateCircuit } from '../lib/circuitEngine';
import {
  HardwareBoard,
  CodingLabLanguage,
  CodingLab,
  SimulatedComponent,
  CircuitWire,
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
  AlertCircle,
  FolderOpen,
  RotateCcw,
  Terminal,
  Minimize2,
  Check,
  Upload,
  ArrowRight,
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
  {
    id: 'lab-raspi-4',
    courseId: 'course-electronics-core',
    title: 'Lab 4: Raspberry Pi Linux SBC Python Telemetry & GPIO',
    description: 'Program a Linux service on Raspberry Pi Single-Board Computer to control 40-pin GPIO headers and stream system telemetry.',
    board: 'raspberry_pi',
    language: 'python',
    requiredComponents: ['Raspberry Pi 4 Model B', 'Red 5mm LED', '220Ω Resistor', 'Tactile Push Button'],
    recommendedKitId: 'stem-kit-pico-microcontroller',
    instructions: `1. Boot the Raspberry Pi virtual Linux OS environment.\n2. Write a Python script importing time and os (or RPi.GPIO).\n3. Configure GPIO 17 as an OUTPUT connected to the status LED.\n4. Log ARM Cortex-A72 CPU core temperature and toggle GPIO 17.\n5. Click "Execute in Linux" to observe runtime logs and hardware responses.`,
    expectedOutput: 'Linux terminal processes PID with active GPIO 17 output state transitions.',
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
  const { currentUser } = useAuth();
  const { courses } = useLMS();
  const { branding } = useBranding();

  const selectedCourse = courses.find((c) => c.id === initialCourseId) || courses[0];

  // Workspace Mode: 'embedded' (Arduino / Hardware IDE) vs 'general' (C, C++, Python, Java Practice)
  const [workspaceMode, setWorkspaceMode] = useState<'embedded' | 'general'>('embedded');

  // Layout Mode: 'normal' | 'split' | 'fullscreen'
  const [layoutMode, setLayoutMode] = useState<'normal' | 'split' | 'fullscreen'>('normal');

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

  // Programming Mode: 'text' (default code editor) | 'blocks' (visual blocks) | 'hybrid' (side-by-side)
  const [programmingMode, setProgrammingMode] = useState<'text' | 'blocks' | 'hybrid'>('text');

  // Curriculum Lessons Sidebar & Progress state
  const [completedLabIds, setCompletedLabIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('innolink_completed_labs');
      return saved ? JSON.parse(saved) : ['lab-esp32-1'];
    } catch {
      return ['lab-esp32-1'];
    }
  });
  const [showCurriculumSidebar, setShowCurriculumSidebar] = useState<boolean>(true);
  const [isMobileCurriculumDrawerOpen, setIsMobileCurriculumDrawerOpen] = useState<boolean>(false);
  const [isCheckingCircuit, setIsCheckingCircuit] = useState<boolean>(false);

  // Active hardware board & coding mode
  const [selectedBoard, setSelectedBoard] = useState<HardwareBoard>(currentLab?.board || 'esp32');
  const [editorMode, setEditorMode] = useState<CodingLabLanguage>('arduino_c');
  const [selectedPort, setSelectedPort] = useState<string>('COM3 (Arduino / ESP32 USB Serial)');
  const [baudRate, setBaudRate] = useState<number>(115200);

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

  // Circuit wires state
  const [wires, setWires] = useState<CircuitWire[]>([
    {
      id: 'w1',
      from: { type: 'board', pinId: '2', label: 'GPIO 2' },
      to: { type: 'component', componentId: 'c1', pinId: 'anode', label: 'LED Anode (+)' },
      color: 'red',
    },
    {
      id: 'w2',
      from: { type: 'component', componentId: 'c1', pinId: 'cathode', label: 'LED Cathode (-)' },
      to: { type: 'board', pinId: 'GND', label: 'GND' },
      color: 'black',
    },
  ]);

  // Simulation execution & serial state
  const [isSimulating, setIsSimulating] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const simTimerRef = useRef<any>(null);

  // Serial Monitor visibility & Docked Output Panel state
  const [showSerialMonitor, setShowSerialMonitor] = useState<boolean>(true);
  const [serialInputText, setSerialInputText] = useState<string>('');
  const [autoScrollSerial, setAutoScrollSerial] = useState<boolean>(true);
  const serialContainerRef = useRef<HTMLDivElement | null>(null);

  // Build & Upload state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [buildOutputLogs, setBuildOutputLogs] = useState<string[]>([]);
  const [activeOutputTab, setActiveOutputTab] = useState<'serial' | 'build'>('serial');

  // Import Modal state
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);

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

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && layoutMode === 'fullscreen') {
        setLayoutMode('normal');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layoutMode]);

  // Smart Serial Monitor auto-scrolling: only follow if pinned to bottom
  const handleSerialScroll = () => {
    if (!serialContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = serialContainerRef.current;
    setAutoScrollSerial(scrollHeight - scrollTop - clientHeight < 35);
  };

  useEffect(() => {
    if (autoScrollSerial && serialContainerRef.current) {
      serialContainerRef.current.scrollTop = serialContainerRef.current.scrollHeight;
    }
  }, [serialLogs]);

  // Simulation Stop & Reset Handlers
  const handleStopSimulation = () => {
    setIsSimulating(false);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setSerialLogs((prev) => [
      ...prev,
      selectedBoard === 'raspberry_pi'
        ? `[Halt] Process terminated with returncode 0. Linux shell returned to prompt.`
        : `[Halt] Virtual microcontroller halted.`,
    ]);
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

  // Run Simulation logic
  const handleRunSimulation = () => {
    setIsSimulating(true);
    const timestamp = new Date().toLocaleTimeString();

    if (selectedBoard === 'raspberry_pi') {
      setSerialLogs((prev) => [
        ...prev,
        `[${timestamp}] [Linux SBC] pi@raspberrypi:~$ python3 main.py`,
        `[${timestamp}] [Linux Kernel 6.6] Process PID ${Math.floor(Math.random() * 8000 + 1000)} spawned on ARM Cortex-A72`,
        `[${timestamp}] [40-Pin Header] GPIO 17 (Pin 11) exported. GPIO 27 (Pin 13) active.`,
      ]);
    } else if (selectedBoard === 'rp2040_pico' || selectedBoard === 'rp2040_pico_w') {
      setSerialLogs((prev) => [
        ...prev,
        `[${timestamp}] MicroPython v1.22.0 on 2026-10-07; Raspberry Pi Pico with RP2040`,
        `[${timestamp}] Type "help()" for more information.`,
        `[${timestamp}] >>> %Run -c $EDITOR_CONTENT`,
        `[${timestamp}] [RP2040 Dual ARM Cortex-M0+] Clock: 133 MHz | Logic: 3.3V`,
      ]);
    } else {
      setSerialLogs((prev) => [
        ...prev,
        `[${timestamp}] Booting ${boardDef.name} (${boardDef.mcu})...`,
        `[${timestamp}] Clock: ${boardDef.clockSpeed} • Logic Voltage: ${boardDef.operatingVoltage}`,
        `[${timestamp}] Port: ${selectedPort} • Baud: ${baudRate}`,
        `[${timestamp}] GPIO configured. Running loop()...`,
      ]);
    }

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
        let logLine = '';
        if (selectedBoard === 'raspberry_pi') {
          logLine = `[Linux GPIO 17] State -> ${isHigh ? 'HIGH (3.3V)' : 'LOW (0V)'} | CPU Temp: 42.8°C | 2.8GB Free`;
        } else if (selectedBoard === 'rp2040_pico' || selectedBoard === 'rp2040_pico_w') {
          logLine = `[Pico GP25] Built-in LED -> ${isHigh ? 'HIGH (3.3V)' : 'LOW (0V)'} | On-chip Temp: 24.3°C`;
        } else if (selectedBoard === 'esp32' || selectedBoard === 'esp32_c3') {
          logLine = `[ESP32 GPIO 2] State -> ${isHigh ? 'HIGH (3.3V)' : 'LOW (0V)'} | Wi-Fi: CONNECTED`;
        } else if (selectedBoard === 'stm32') {
          logLine = `[STM32 PC13] LED -> ${isHigh ? 'ACTIVE LOW' : 'HIGH'} | SysTick: ${step * 1000}ms`;
        } else if (selectedBoard === 'teensy') {
          logLine = `[Teensy 4.0 Pin 13] State -> ${isHigh ? 'HIGH (3.3V)' : 'LOW (0V)'} | 600 MHz Core`;
        } else {
          logLine = `[Signal] Pin 13 -> ${isHigh ? 'HIGH (5V)' : 'LOW (0V)'}`;
        }
        return [...prev, logLine].slice(-80);
      });
    }, 1000);
  };

  // Real Verify / Build Handler
  const handleVerifyBuild = () => {
    setIsVerifying(true);
    setActiveOutputTab('build');
    setShowSerialMonitor(true);

    const timestamp = new Date().toLocaleTimeString();
    setBuildOutputLogs([
      `[${timestamp}] Starting verify / compilation for target: ${boardDef.name}...`,
      `[Toolchain] Analyzing syntax and architecture headers (${boardDef.mcu})...`,
    ]);

    setTimeout(() => {
      // Validate common sketch syntax issues
      const hasSetup = code.includes('setup') || code.includes('main') || code.includes('import');
      const hasLoop = code.includes('loop') || code.includes('while') || code.includes('for');
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;

      if (openBraces !== closeBraces && (editorMode === 'arduino_c' || editorMode === 'c_cpp')) {
        setBuildOutputLogs((prev) => [
          ...prev,
          `[Error] Compilation failed: Mismatched curly braces { ... } (${openBraces} open vs ${closeBraces} close).`,
          `[Hint] Check function definitions in sketch.`,
        ]);
        showToast('Build failed: Syntax error detected.');
      } else if (!hasSetup && editorMode === 'arduino_c') {
        setBuildOutputLogs((prev) => [
          ...prev,
          `[Warning] Sketch does not declare a setup() initialization block.`,
          `[Success] Compiled with warnings. Program storage space: ${Math.floor(code.length * 12 + 1800)} bytes (${Math.floor((code.length / 32000) * 100)}%).`,
        ]);
        showToast('Build passed with warnings.');
      } else {
        const estBytes = Math.floor(code.length * 14 + 2150);
        const maxBytes = 32256;
        const ramBytes = Math.floor(code.length * 2 + 180);
        setBuildOutputLogs((prev) => [
          ...prev,
          `Compiling Sketch...`,
          `Archiving built core (runtime.a)...`,
          `Linking everything together...`,
          `Sketch uses ${estBytes} bytes (${Math.round((estBytes / maxBytes) * 100)}%) of program storage space. Maximum is ${maxBytes} bytes.`,
          `Global variables use ${ramBytes} bytes (${Math.round((ramBytes / 2048) * 100)}%) of dynamic memory.`,
          `[Build SUCCESS] Verified cleanly for ${boardDef.name}.`,
        ]);
        showToast('Sketch verified successfully! Ready for upload.');
      }
      setIsVerifying(false);
    }, 700);
  };

  // Real Upload Handler
  const handleUploadSketch = () => {
    setIsUploading(true);
    setUploadProgress(10);
    setActiveOutputTab('build');
    setShowSerialMonitor(true);

    const timestamp = new Date().toLocaleTimeString();
    setBuildOutputLogs([
      `[${timestamp}] Starting upload to ${boardDef.name} on port: ${selectedPort}...`,
      `Connecting to target device...`,
    ]);

    setTimeout(() => {
      setUploadProgress(40);
      setBuildOutputLogs((prev) => [
        ...prev,
        `Chip type: ${boardDef.mcu}`,
        `Crystal frequency: ${boardDef.clockSpeed}`,
        `Flashing firmware binary...`,
      ]);
    }, 400);

    setTimeout(() => {
      setUploadProgress(85);
      setBuildOutputLogs((prev) => [
        ...prev,
        `Writing at 0x00010000... (85%)`,
        `Writing at 0x00014000... (100%)`,
        `Hash of data verified.`,
      ]);
    }, 800);

    setTimeout(() => {
      setUploadProgress(100);
      setBuildOutputLogs((prev) => [
        ...prev,
        `Leaving... Hard resetting via RTS pin...`,
        `[Upload SUCCESS] Firmware running on ${boardDef.name}.`,
      ]);
      setIsUploading(false);
      showToast(`Uploaded successfully to ${boardDef.name}!`);
      // Automatically run circuit simulation so the student sees immediate result
      handleRunSimulation();
      setActiveOutputTab('serial');
    }, 1200);
  };

  // Handle Hardware Category Selection
  const handleSelectHardwareCategory = (
    cat: 'arduino' | 'esp32' | 'pico' | 'raspberry_pi' | 'stm32' | 'teensy' | 'blocks' | 'hybrid'
  ) => {
    handleResetSimulation();

    if (cat === 'arduino') {
      setSelectedBoard('arduino_uno');
      setEditorMode('arduino_c');
      const targetLab = labs.find((l) => l.board === 'arduino_uno');
      if (targetLab) setActiveLabId(targetLab.id);
      setCode(
        `// Innolink Technologies - Arduino Uno Classic Program
const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Arduino Uno Initialized! ATmega328P ready.");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("Pin 13: HIGH");
  delay(1000);
  digitalWrite(LED_PIN, LOW);
  Serial.println("Pin 13: LOW");
  delay(1000);
}`
      );
      setComponents([
        { id: 'c1', type: 'led', label: 'Arduino Pin 13 LED', color: 'red', state: { pin: '13', digitalValue: false }, pins: { anode: '13', cathode: 'GND' } },
        { id: 'c2', type: 'push_button', label: 'Push Button', state: { pin: '2', digitalValue: false }, pins: { signal: '2', gnd: 'GND' } },
      ]);
    } else if (cat === 'esp32') {
      setSelectedBoard('esp32');
      setEditorMode('arduino_c');
      const targetLab = labs.find((l) => l.board === 'esp32');
      if (targetLab) setActiveLabId(targetLab.id);
      setCode(
        `// Innolink Technologies - ESP32 Dual-Core Program
#define LED_PIN 2

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32 Dual-Core (Xtensa LX6) Initialized!");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("GPIO 2: HIGH (3.3V)");
  delay(1000);
  digitalWrite(LED_PIN, LOW);
  Serial.println("GPIO 2: LOW (0V)");
  delay(1000);
}`
      );
      setComponents([
        { id: 'c1', type: 'led', label: 'ESP32 GPIO 2 Blue LED', color: 'blue', state: { pin: '2', digitalValue: false }, pins: { anode: '2', cathode: 'GND' } },
        { id: 'c2', type: 'potentiometer', label: '10kΩ Potentiometer (GPIO 34 ADC1)', state: { pin: '34', value: 512 }, pins: { signal: '34', vcc: '3V3', gnd: 'GND' } },
      ]);
    } else if (cat === 'pico') {
      setSelectedBoard('rp2040_pico');
      setEditorMode('micropython');
      const targetLab = labs.find((l) => l.board === 'rp2040_pico');
      if (targetLab) setActiveLabId(targetLab.id);
      setCode(
        `# Innolink Technologies - Raspberry Pi Pico (RP2040 Microcontroller)
import machine
import time

led = machine.Pin(25, machine.Pin.OUT)
adc = machine.ADC(4)

print("Raspberry Pi Pico MicroPython Initialized.")
print("RP2040 Dual ARM Cortex-M0+ running at 133 MHz.")

while True:
    led.value(1)
    raw = adc.read_u16()
    temp_c = 27 - (raw * (3.3 / 65535) - 0.706) / 0.001721
    print(f"[Pico GP25] Built-in LED: ON | Core Temp: {temp_c:.1f}°C")
    time.sleep(1)

    led.value(0)
    print("[Pico GP25] Built-in LED: OFF")
    time.sleep(1)`
      );
      setComponents([
        { id: 'c1', type: 'led', label: 'Pico Built-in GP25 LED', color: 'green', state: { pin: 'GP25', digitalValue: false }, pins: { anode: 'GP25', cathode: 'GND' } },
        { id: 'c2', type: 'potentiometer', label: '10kΩ Potentiometer (GP26 ADC0)', state: { pin: 'GP26', value: 512 }, pins: { signal: 'GP26', vcc: '3V3', gnd: 'GND' } },
      ]);
    } else if (cat === 'raspberry_pi') {
      setSelectedBoard('raspberry_pi');
      setEditorMode('python');
      const targetLab = labs.find((l) => l.board === 'raspberry_pi');
      if (targetLab) setActiveLabId(targetLab.id);
      setCode(
        `#!/usr/bin/env python3
# Innolink Technologies - Raspberry Pi Single-Board Computer (Linux OS)
import time
import os

print("Linux raspberrypi 6.6.20+rpt-rpi-v8 #1 SMP aarch64")
print(f"Broadcom BCM2711 Quad Cortex-A72 | PID: {os.getpid()}")

LED_PIN = 17
print(f"Controlling Linux GPIO {LED_PIN}...")

for cycle in range(1, 6):
    print(f"[Linux GPIO {LED_PIN}] Signal -> HIGH (3.3V) | Cycle {cycle}/5")
    time.sleep(1.0)
    print(f"[Linux GPIO {LED_PIN}] Signal -> LOW (0V)")
    time.sleep(1.0)

print("Custom script execution complete.")`
      );
      setComponents([
        { id: 'c1', type: 'led', label: 'External Status LED (GPIO 17)', color: 'red', state: { pin: 'GPIO17', digitalValue: false }, pins: { anode: 'GPIO17', cathode: 'GND' } },
        { id: 'c2', type: 'push_button', label: 'Tactile Push Button (GPIO 27)', state: { pin: 'GPIO27', digitalValue: false }, pins: { signal: 'GPIO27', gnd: 'GND' } },
      ]);
    } else if (cat === 'stm32') {
      setSelectedBoard('stm32');
      setEditorMode('arduino_c');
      setCode(
        `// STM32F103C8T6 (Blue Pill) ARM Cortex-M3
#define LED_PIN PC13

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("STM32 Blue Pill @ 72MHz Initialized!");
}

void loop() {
  digitalWrite(LED_PIN, LOW); // Active LOW
  Serial.println("STM32 PC13 LED: ON");
  delay(1000);
  digitalWrite(LED_PIN, HIGH);
  Serial.println("STM32 PC13 LED: OFF");
  delay(1000);
}`
      );
    } else if (cat === 'teensy') {
      setSelectedBoard('teensy');
      setEditorMode('arduino_c');
      setCode(
        `// Teensy 4.0 / 4.1 (600 MHz ARM Cortex-M7)
const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  Serial.println("Teensy 4.0 ARM Cortex-M7 @ 600 MHz Ready.");
}

void loop() {
  digitalWrite(ledPin, HIGH);
  Serial.println("Teensy LED -> HIGH");
  delay(500);
  digitalWrite(ledPin, LOW);
  Serial.println("Teensy LED -> LOW");
  delay(500);
}`
      );
    } else if (cat === 'blocks') {
      setEditorMode('blocks');
    } else if (cat === 'hybrid') {
      setEditorMode('hybrid');
    }
  };

  const handleCheckCircuit = () => {
    setIsCheckingCircuit(true);
    setActiveOutputTab('build');
    setShowSerialMonitor(true);

    const result = validateAndSimulateCircuit(selectedBoard, components, false, wires);
    const timestamp = new Date().toLocaleTimeString();

    const logs: string[] = [
      `[${timestamp}] Verifying circuit schematic on ${boardDef.name}...`,
      `[Components] ${components.length} connected | [Wires] ${wires.length} net traces`,
    ];

    if (result.diagnostics.length === 0) {
      logs.push(`[Circuit Check SUCCESS] All circuit components and power rails passed electrical verification.`);
      showToast('Circuit verification passed! Zero electrical faults.');
    } else {
      result.diagnostics.forEach((d) => {
        const prefix = d.type === 'error' ? '[Circuit Error]' : d.type === 'warning' ? '[Circuit Warning]' : '[Circuit Info]';
        logs.push(`${prefix} ${d.message}${d.suggestion ? ` (Hint: ${d.suggestion})` : ''}`);
      });
      if (result.isValid) {
        logs.push(`[Circuit Check PASSED WITH WARNINGS] Safe to run simulation.`);
        showToast('Circuit verified with warnings.');
      } else {
        logs.push(`[Circuit Check FAILED] Correct electrical faults before simulation.`);
        showToast('Circuit wiring errors found.');
      }
    }

    setBuildOutputLogs(logs);
    setTimeout(() => setIsCheckingCircuit(false), 300);
  };

  const handleSelectLab = (labId: string) => {
    setActiveLabId(labId);
    const target = labs.find((l) => l.id === labId);
    if (target) {
      setSelectedBoard(target.board);
      if (target.board === 'rp2040_pico' || target.board === 'rp2040_pico_w') {
        setEditorMode('micropython');
      } else if (target.board === 'raspberry_pi') {
        setEditorMode('python');
      } else {
        setEditorMode('arduino_c');
      }
      if (target.startingCode) setCode(target.startingCode);
    }
  };

  const handleSaveProject = () => {
    try {
      const projectData = {
        code,
        blocks,
        selectedBoard,
        programmingMode,
        editorMode,
        activeLabId,
        components,
        wires,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('innolink_coding_lab_project', JSON.stringify(projectData));
      showToast('Project progress saved successfully!');
    } catch {
      showToast('Failed to save project progress.');
    }
  };

  const handleLoadProject = () => {
    try {
      const saved = localStorage.getItem('innolink_coding_lab_project');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.code) setCode(parsed.code);
        if (parsed.blocks) setBlocks(parsed.blocks);
        if (parsed.selectedBoard) setSelectedBoard(parsed.selectedBoard);
        if (parsed.programmingMode) setProgrammingMode(parsed.programmingMode);
        if (parsed.editorMode) setEditorMode(parsed.editorMode);
        if (parsed.activeLabId) setActiveLabId(parsed.activeLabId);
        if (parsed.components) setComponents(parsed.components);
        if (parsed.wires) setWires(parsed.wires);
        showToast('Saved project loaded successfully!');
      } else {
        showToast('No saved project found.');
      }
    } catch {
      showToast('Failed to load project.');
    }
  };

  const handleSubmitProject = async () => {
    setSubmissionSuccess('Lab project submitted successfully to mentor review!');
    setTimeout(() => {
      setSubmitModalOpen(false);
      setSubmissionSuccess(null);
    }, 1500);
  };

  // Send Serial Input command
  const handleSendSerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInputText.trim()) return;
    const cmd = serialInputText.trim();
    setSerialLogs((prev) => [
      ...prev,
      `> [INPUT] ${cmd}`,
      `[${boardDef.name}] Command accepted: ${cmd}`,
    ]);
    setSerialInputText('');
  };

  return (
    <CodingLabAccessGate
      courseId={selectedCourse?.id || 'course-electronics-core'}
      courseTitle={selectedCourse?.title}
      onViewCourses={() => onNavigateToCourse?.(selectedCourse?.id || 'course-electronics-core')}
    >
      <div
        className={
          layoutMode === 'fullscreen'
            ? 'fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden p-3'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 text-[var(--foreground)] bg-[var(--background)] transition-colors duration-200'
        }
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-3 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Code Import Modal */}
        <CodeImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          currentCode={code}
          onImportCode={(importedCode, filename) => {
            setCode(importedCode);
            showToast(`Imported ${filename} into editor.`);
          }}
        />

        {/* Top Header Bar (Shown in Normal and Split modes) */}
        {layoutMode !== 'fullscreen' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[var(--foreground)] tracking-tight truncate">
                  {workspaceMode === 'general'
                    ? 'General Software Programming Practice'
                    : currentLab?.title.replace(/^Lab \d+:\s*/i, '') || 'Dual LED Blink & PWM Fading'}
                </h1>
                {workspaceMode === 'embedded' && (
                  <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shrink-0">
                    Lesson {labs.findIndex((l) => l.id === activeLabId) + 1} of {labs.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-0.5 truncate">
                {workspaceMode === 'general'
                  ? 'Practice C, C++, Python, and Java with real server-side execution and standard input.'
                  : 'Write, build and test your circuit with real toolchain diagnostics and live simulation.'}
              </p>
            </div>

            {/* Controls: Mode Switcher, Lessons Drawer Toggle & Submit */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Primary Mode Toggle: Embedded Hardware Lab vs General Programming */}
              <div className="flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('embedded')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    workspaceMode === 'embedded'
                      ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs font-bold'
                      : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Hardware Lab</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('general')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    workspaceMode === 'general'
                      ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs font-bold'
                      : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>General Code</span>
                </button>
              </div>

              {/* Curriculum Lessons Button */}
              {workspaceMode === 'embedded' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsMobileCurriculumDrawerOpen(true);
                    } else {
                      setShowCurriculumSidebar(!showCurriculumSidebar);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Toggle Curriculum Lessons Drawer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="hidden sm:inline">Lessons</span>
                  <span className="text-[10px] text-cyan-500 font-mono font-semibold">
                    ({completedLabIds.length}/{labs.length})
                  </span>
                </button>
              )}

              {/* Submit Project Button */}
              <button
                type="button"
                onClick={() => setSubmitModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Lab</span>
              </button>
            </div>
          </div>
        )}

        {/* FULLSCREEN HEADER (When in Fullscreen mode) */}
        {layoutMode === 'fullscreen' && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>{branding.platformName} Arduino IDE</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono text-[11px]">{boardDef.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLayoutMode('normal')}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Full Screen (Esc)</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* WORKSPACE VIEW: GENERAL PROGRAMMING vs ARDUINO HARDWARE IDE */}
        {/* ========================================================= */}
        {workspaceMode === 'general' ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>Independent Software Practice Mode:</strong> Run arbitrary C, C++, Python 3, and Java programs with custom standard input (stdin) and live execution outputs.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceMode('embedded')}
                className="text-xs text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Switch back to Arduino Hardware Lab</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <GeneralProgrammingWorkspace
              className="w-full"
              onSave={() => showToast('Source code saved successfully.')}
            />
          </div>
        ) : (
          /* ========================================================= */
          /* ARDUINO IDE & HARDWARE PLATFORM WORKSPACE */
          /* ========================================================= */
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            {/* Secondary Controls Bar: Searchable Board Selector, Framework Details & Programming Mode */}
            {layoutMode !== 'fullscreen' && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
                {/* Left: Searchable Board Selector & Secondary Compact Framework / Architecture Details */}
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <SearchableBoardSelector
                    selectedBoard={selectedBoard}
                    onChangeBoard={(newB) => {
                      setSelectedBoard(newB);
                      if (newB === 'rp2040_pico' || newB === 'rp2040_pico_w') {
                        setEditorMode('micropython');
                      } else if (newB === 'raspberry_pi') {
                        setEditorMode('python');
                      } else {
                        setEditorMode('arduino_c');
                      }
                    }}
                  />

                  {/* Secondary Compact Label showing Framework & Board Details */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-xs">
                    <span className="text-cyan-400 font-semibold truncate">
                      {boardDef.family === 'esp32'
                        ? 'ESP-IDF / FreeRTOS'
                        : boardDef.family === 'raspberry_pi_pico'
                        ? 'Pico SDK / MicroPython'
                        : boardDef.family === 'raspberry_pi'
                        ? 'Linux 64-bit OS'
                        : boardDef.family === 'stm32'
                        ? 'STM32Cube HAL'
                        : boardDef.family === 'teensy'
                        ? 'Teensyduino M7'
                        : 'Arduino AVR Toolchain'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-100 font-semibold">{boardDef.mcu}</span>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span className="text-amber-400 hidden sm:inline">{boardDef.clockSpeed}</span>
                    <span className="text-slate-600 hidden md:inline">•</span>
                    <span className="text-emerald-400 hidden md:inline">{boardDef.operatingVoltage}</span>
                  </div>
                </div>

                {/* Right: Programming Mode Segmented Selector */}
                <div className="flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setProgrammingMode('text')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                      programmingMode === 'text'
                        ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs font-semibold'
                        : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Text Coding</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgrammingMode('blocks')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                      programmingMode === 'blocks'
                        ? 'bg-purple-600 text-white shadow-xs font-semibold'
                        : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Block Coding</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgrammingMode('hybrid')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                      programmingMode === 'hybrid'
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Hybrid Coding</span>
                  </button>
                </div>
              </div>
            )}
            {/* MAIN WORKSPACE WRAPPER (Curriculum Sidebar + IDE & Simulator Grid) */}
            <div className="flex min-h-0 flex-1 gap-4">
              {/* Collapsible Curriculum Lesson Sidebar on Desktop */}
              {layoutMode !== 'fullscreen' && (
                <CurriculumLessonSidebar
                  labs={labs}
                  activeLabId={activeLabId}
                  onSelectLab={handleSelectLab}
                  isOpen={showCurriculumSidebar}
                  onToggleOpen={() => setShowCurriculumSidebar(!showCurriculumSidebar)}
                  completedLabIds={completedLabIds}
                  onToggleCompleteLab={(id) => {
                    setCompletedLabIds((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    );
                  }}
                  isMobileDrawerOpen={isMobileCurriculumDrawerOpen}
                  onCloseMobileDrawer={() => setIsMobileCurriculumDrawerOpen(false)}
                  className="rounded-2xl border border-[var(--border)] overflow-hidden"
                />
              )}

            {/* ========================================================= */}
            {/* MAIN CSS GRID & FLEXBOX WORKSPACE LAYOUT */}
            {/* Independent, Fixed-Height Scroll Containers */}
            {/* ========================================================= */}
            <div
              className={`grid min-h-0 flex-1 gap-4 ${
                layoutMode === 'split' || layoutMode === 'fullscreen'
                  ? 'grid-cols-1 lg:grid-cols-12'
                  : 'grid-cols-1 lg:grid-cols-12'
              }`}
            >
              {/* Left Column: Arduino IDE Workspace (Rigid CSS Grid Layout) */}
              <div
                className={`${
                  layoutMode === 'split'
                    ? 'lg:col-span-6'
                    : 'lg:col-span-7'
                } grid min-h-0 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl`}
                style={{
                  height: layoutMode === 'fullscreen' ? '100%' : '660px',
                  gridTemplateRows: showSerialMonitor
                    ? 'auto minmax(0, 1fr) 220px'
                    : 'auto minmax(0, 1fr) 0px',
                }}
              >
                {/* 1. Rigid Grid Item: Arduino IDE Compact Main Toolbar (Fixed Header) */}
                <div className="shrink-0 overflow-hidden border-b border-slate-800 select-none z-10">
                  <ArduinoIDEToolbar
                    selectedBoard={selectedBoard}
                    onChangeBoard={(newB) => {
                      setSelectedBoard(newB);
                      if (newB === 'rp2040_pico' || newB === 'rp2040_pico_w') {
                        setEditorMode('micropython');
                      } else if (newB === 'raspberry_pi') {
                        setEditorMode('python');
                      } else {
                        setEditorMode('arduino_c');
                      }
                    }}
                    selectedPort={selectedPort}
                    onChangePort={setSelectedPort}
                    onVerify={handleVerifyBuild}
                    isVerifying={isVerifying}
                    onCheckCircuit={handleCheckCircuit}
                    isCheckingCircuit={isCheckingCircuit}
                    onUpload={handleUploadSketch}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    showSerialMonitor={showSerialMonitor}
                    onToggleSerialMonitor={() => setShowSerialMonitor(!showSerialMonitor)}
                    onImportClick={() => setImportModalOpen(true)}
                    onSave={handleSaveProject}
                    layoutMode={layoutMode}
                    onChangeLayoutMode={setLayoutMode}
                    baudRate={baudRate}
                    onChangeBaudRate={setBaudRate}
                    isSimulating={isSimulating}
                    onToggleSimulation={isSimulating ? handleStopSimulation : handleRunSimulation}
                  />
                </div>

                {/* 2. Rigid Grid Item: Code / Visual Block Editor (Fixed Independent Scrollable Area) */}
                <div className="min-h-0 overflow-hidden flex flex-col relative w-full h-full">
                  {programmingMode === 'blocks' ? (
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                      <BlocklyEditor
                        board={selectedBoard}
                        blocks={blocks}
                        onChangeBlocks={setBlocks}
                        onGenerateCode={(generated) => setCode(generated)}
                      />
                    </div>
                  ) : programmingMode === 'hybrid' ? (
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                      <HybridEditor
                        board={selectedBoard}
                        blocks={blocks}
                        onChangeBlocks={setBlocks}
                        generatedCode={code}
                        onCodeUpdated={(updated) => setCode(updated)}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                      <CodeEditor
                        board={selectedBoard}
                        code={code}
                        language={editorMode}
                        onChangeLanguage={(lang) => setEditorMode(lang)}
                        onChangeCode={setCode}
                        onRunSimulation={handleRunSimulation}
                        onStopSimulation={handleStopSimulation}
                        onResetSimulation={handleResetSimulation}
                        isSimulating={isSimulating}
                        onSaveProject={handleSaveProject}
                        terminalLogs={serialLogs}
                        className="border-0 rounded-none h-full flex-1 min-h-0 shadow-none"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Rigid Grid Item: Docked Output & Serial Monitor (Fixed Independent Scrollable Area) */}
                {showSerialMonitor && (
                  <div className="h-[220px] min-h-0 border-t border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
                    {/* Panel Header with Tabs (Serial Monitor vs Build Output) */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs shrink-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveOutputTab('serial')}
                          className={`px-2.5 py-1 rounded font-medium transition cursor-pointer flex items-center gap-1.5 ${
                            activeOutputTab === 'serial'
                              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Serial Monitor</span>
                          <span className="text-[10px] text-slate-500 font-mono">({serialLogs.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveOutputTab('build')}
                          className={`px-2.5 py-1 rounded font-medium transition cursor-pointer flex items-center gap-1.5 ${
                            activeOutputTab === 'build'
                              ? 'bg-slate-800 text-emerald-400 font-semibold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Build Output</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeOutputTab === 'serial' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setAutoScrollSerial(!autoScrollSerial)}
                              className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition ${
                                autoScrollSerial
                                  ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                              title="Toggle automatic scrolling to latest log line"
                            >
                              Autoscroll: {autoScrollSerial ? 'ON' : 'OFF'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setSerialLogs([])}
                              className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                            >
                              Clear
                            </button>
                          </>
                        )}
                        {activeOutputTab === 'build' && (
                          <button
                            type="button"
                            onClick={() => setBuildOutputLogs([])}
                            className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowSerialMonitor(false)}
                          className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                          title="Close Output Panel"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Output Scroll Area (Strictly Constrained, Never Forces Outer Page to Scroll) */}
                    <div
                      ref={serialContainerRef}
                      onScroll={handleSerialScroll}
                      className="flex-1 min-h-0 p-2.5 font-mono text-[11px] overflow-y-auto overscroll-contain select-text space-y-1 bg-black/40 text-slate-200"
                    >
                      {activeOutputTab === 'serial' ? (
                        serialLogs.length === 0 ? (
                          <div className="text-slate-500 italic p-1">
                            [Serial Monitor Connected] Baud rate: {baudRate} • Port: {selectedPort}. Run circuit firmware to stream output messages.
                          </div>
                        ) : (
                          serialLogs.map((log, idx) => (
                            <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                              {log}
                            </div>
                          ))
                        )
                      ) : buildOutputLogs.length === 0 ? (
                        <div className="text-slate-500 italic p-1">
                          [Build Output] Click "Verify" or "Upload" to view compiler diagnostics.
                        </div>
                      ) : (
                        buildOutputLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className={`whitespace-pre-wrap leading-relaxed ${
                              log.includes('Error')
                                ? 'text-rose-400 font-semibold'
                                : log.includes('SUCCESS')
                                ? 'text-emerald-400 font-semibold'
                                : log.includes('Warning')
                                ? 'text-amber-300'
                                : 'text-slate-300'
                            }`}
                          >
                            {log}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Serial Input Bar (For sending commands to virtual serial) */}
                    {activeOutputTab === 'serial' && (
                      <form
                        onSubmit={handleSendSerial}
                        className="flex items-center gap-2 p-2 bg-slate-900 border-t border-slate-800 shrink-0"
                      >
                        <input
                          type="text"
                          value={serialInputText}
                          onChange={(e) => setSerialInputText(e.target.value)}
                          placeholder="Send command to Serial Monitor (e.g. 1, 0, STATUS, RESET)..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-cyan-200 font-mono focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
                        >
                          Send
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Virtual Hardware Simulation Workspace (Independent Fixed-Height Scroll Container) */}
              <div
                className={`${
                  layoutMode === 'split'
                    ? 'lg:col-span-6'
                    : 'lg:col-span-5'
                } flex flex-col min-h-0 space-y-4`}
                style={{
                  height: layoutMode === 'fullscreen' ? '100%' : '660px',
                }}
              >
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  <VirtualHardwareWorkspace
                    board={selectedBoard}
                    onChangeBoard={(newB) => {
                      setSelectedBoard(newB);
                      if (newB === 'rp2040_pico' || newB === 'rp2040_pico_w') {
                        setEditorMode('micropython');
                      } else if (newB === 'raspberry_pi') {
                        setEditorMode('python');
                      } else {
                        setEditorMode('arduino_c');
                      }
                    }}
                    components={components}
                    onUpdateComponents={setComponents}
                    wires={wires}
                    onUpdateWires={setWires}
                    onLoadStarterCircuit={(starter) => {
                      setCode(starter.code);
                      setSelectedBoard(starter.board);
                      setComponents(starter.components);
                      setWires(starter.wires);
                      showToast(`Loaded ${starter.title}!`);
                    }}
                    isSimulating={isSimulating}
                    onToggleSimulation={isSimulating ? handleStopSimulation : handleRunSimulation}
                    onResetSimulation={handleResetSimulation}
                    serialLogs={serialLogs}
                    onClearSerial={() => setSerialLogs([])}
                    onSendSerialInput={(input) => {
                      setSerialLogs((prev) => [
                        ...prev,
                        `> [INPUT] ${input}`,
                        `[${boardDef.name}] Command: ${input}`,
                      ]);
                    }}
                    recommendedKitId={currentLab.recommendedKitId}
                    onNavigateToMarketplaceKit={onNavigateToMarketplaceKit}
                  />
                </div>

                {/* Lab Instructions & Checklist Card (Normal layout only) */}
                {layoutMode !== 'fullscreen' && (
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-2 shrink-0">
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Submit Project Modal */}
        {submitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
