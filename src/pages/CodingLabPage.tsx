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
  Terminal,
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

  // Hardware Platform Category: Arduino, ESP32, Raspberry Pi Pico, Raspberry Pi, Block Coding, Hybrid Coding
  const [selectedCategory, setSelectedCategory] = useState<
    'arduino' | 'esp32' | 'pico' | 'raspberry_pi' | 'blocks' | 'hybrid'
  >(() => {
    if (labs[0]?.board === 'rp2040_pico') return 'pico';
    if (labs[0]?.board === 'raspberry_pi') return 'raspberry_pi';
    if (labs[0]?.board === 'arduino_uno') return 'arduino';
    return 'esp32';
  });

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
    } else if (selectedBoard === 'rp2040_pico') {
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
        } else if (selectedBoard === 'rp2040_pico') {
          logLine = `[Pico GP25] Built-in LED -> ${isHigh ? 'HIGH (3.3V)' : 'LOW (0V)'} | On-chip Temp: 24.3°C`;
        } else if (selectedBoard === 'esp32') {
          logLine = `[ESP32 GPIO 2] State -> ${isHigh ? 'HIGH (3.3V)' : 'LOW (0V)'} | Wi-Fi: CONNECTED`;
        } else {
          logLine = `[Signal] Pin 13 -> ${isHigh ? 'HIGH (5V)' : 'LOW (0V)'}`;
        }
        return [...prev, logLine].slice(-40);
      });
    }, 1000);
  };

  // Handle Hardware Category Selection
  const handleSelectHardwareCategory = (
    cat: 'arduino' | 'esp32' | 'pico' | 'raspberry_pi' | 'blocks' | 'hybrid'
  ) => {
    setSelectedCategory(cat);
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

# GP25 is the built-in LED on the Raspberry Pi Pico
led = machine.Pin(25, machine.Pin.OUT)
adc = machine.ADC(4) # Internal chip temperature sensor

print("=========================================")
print(" Raspberry Pi Pico MicroPython Initialized")
print(" RP2040 Dual ARM Cortex-M0+ @ 133 MHz")
print("=========================================")

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
# Architecture: 64-bit ARMv8 Quad-Core Cortex-A72 @ 1.8GHz
import time
import os

print("==================================================")
print(" Linux raspberrypi 6.6.20+rpt-rpi-v8 #1 SMP aarch64")
print(" Welcome to Raspberry Pi OS (Debian GNU/Linux)")
print(f" Broadcom BCM2711 Quad Cortex-A72 | PID: {os.getpid()}")
print("==================================================")

# 40-Pin Header: GPIO 17 (Physical Pin 11)
LED_PIN = 17
print(f"Exporting Linux GPIO {LED_PIN} via /dev/gpiochip0...")

def main():
    for cycle in range(1, 6):
        print(f"[Linux GPIO {LED_PIN}] State -> HIGH (3.3V) | Cycle {cycle}/5")
        time.sleep(1.0)
        print(f"[Linux GPIO {LED_PIN}] State -> LOW (0V)")
        time.sleep(1.0)
    print("Execution complete. Daemon listening for GPIO events.")

if __name__ == "__main__":
    main()`
      );
      setComponents([
        { id: 'c1', type: 'led', label: 'External Status LED (GPIO 17 / Pin 11)', color: 'red', state: { pin: 'GPIO17', digitalValue: false }, pins: { anode: 'GPIO17', cathode: 'GND' } },
        { id: 'c2', type: 'push_button', label: 'Tactile Push Button (GPIO 27 / Pin 13)', state: { pin: 'GPIO27', digitalValue: false }, pins: { signal: 'GPIO27', gnd: 'GND' } },
      ]);
    } else if (cat === 'blocks') {
      setEditorMode('blocks');
    } else if (cat === 'hybrid') {
      setEditorMode('hybrid');
    }
  };

  // When active lab changes, update board and instructions
  const handleSelectLab = (labId: string) => {
    setActiveLabId(labId);
    const target = labs.find((l) => l.id === labId);
    if (target) {
      setSelectedBoard(target.board);
      if (target.board === 'rp2040_pico') {
        setSelectedCategory('pico');
        setEditorMode('micropython');
      } else if (target.board === 'raspberry_pi') {
        setSelectedCategory('raspberry_pi');
        setEditorMode('python');
      } else if (target.board === 'arduino_uno') {
        setSelectedCategory('arduino');
        setEditorMode('arduino_c');
      } else {
        setSelectedCategory('esp32');
        setEditorMode('arduino_c');
      }
      if (target.startingCode) setCode(target.startingCode);
    }
  };

  // Create student custom blank program
  const handleNewProgram = () => {
    if (selectedCategory === 'pico') {
      setCode(
        editorMode === 'c_cpp'
          ? `// Raspberry Pi Pico (RP2040) - Custom C/C++ SDK Program
#include <stdio.h>
#include "pico/stdlib.h"

#define PICO_LED_PIN 25

int main() {
  stdio_init_all();
  gpio_init(PICO_LED_PIN);
  gpio_set_dir(PICO_LED_PIN, GPIO_OUT);
  printf("Custom Raspberry Pi Pico C/C++ program initialized.\\n");

  while (true) {
    gpio_put(PICO_LED_PIN, 1);
    printf("Pico GP25 -> HIGH (3.3V)\\n");
    sleep_ms(1000);
    gpio_put(PICO_LED_PIN, 0);
    printf("Pico GP25 -> LOW (0V)\\n");
    sleep_ms(1000);
  }
  return 0;
}`
          : `# Raspberry Pi Pico (RP2040) - Custom MicroPython Script
import machine
import time

led = machine.Pin(25, machine.Pin.OUT)
print("Raspberry Pi Pico RP2040 Microcontroller Ready.")

while True:
    led.toggle()
    print("Pico GP25 toggled!")
    time.sleep(1)`
      );
    } else if (selectedCategory === 'raspberry_pi') {
      setCode(
        editorMode === 'c_cpp'
          ? `// Raspberry Pi Single-Board Computer - Custom Linux C/C++ Program
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
  printf("Raspberry Pi Linux native C process started.\\n");
  printf("Target: aarch64 ARMv8 Quad-Core Cortex-A72\\n");

  for (int i = 1; i <= 5; i++) {
    printf("[Linux Worker] Running tick %d of 5...\\n", i);
    sleep(1);
  }

  printf("Native Linux binary exited with code 0.\\n");
  return 0;
}`
          : `#!/usr/bin/env python3
# Raspberry Pi Single-Board Computer (Linux OS) - Custom Student Script
import time
import os

print(f"Linux raspberrypi 6.6.20-v8+ (Debian GNU/Linux)")
print(f"Broadcom BCM2711 Quad ARM Cortex-A72 @ 1.8GHz | PID: {os.getpid()}")

LED_PIN = 17
print(f"Controlling Linux GPIO {LED_PIN}...")

for cycle in range(1, 6):
    print(f"[Linux GPIO {LED_PIN}] Signal -> HIGH (3.3V) | Cycle {cycle}")
    time.sleep(1.0)
    print(f"[Linux GPIO {LED_PIN}] Signal -> LOW (0V)")
    time.sleep(1.0)

print("Custom script execution complete.")`
      );
    } else if (selectedCategory === 'esp32') {
      setCode(`// ESP32 DevKit V1 - Custom Student Program
#define LED_PIN 2

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32 Dual-Core initialised! Ready for student code.");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("GPIO 2 -> HIGH");
  delay(1000);
  digitalWrite(LED_PIN, LOW);
  Serial.println("GPIO 2 -> LOW");
  delay(1000);
}`);
    } else {
      setCode(`// Arduino Uno R3 - Custom Student Sketch
const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Arduino Uno Initialized!");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("Pin 13: HIGH");
  delay(1000);
  digitalWrite(LED_PIN, LOW);
  Serial.println("Pin 13: LOW");
  delay(1000);
}`);
    }
    showToast('New blank custom student program ready!');
  };

  const handleSaveProject = () => {
    try {
      const projectData = {
        code,
        blocks,
        selectedBoard,
        selectedCategory,
        editorMode,
        activeLabId,
        components,
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
        if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
        if (parsed.editorMode) setEditorMode(parsed.editorMode);
        if (parsed.activeLabId) setActiveLabId(parsed.activeLabId);
        if (parsed.components) setComponents(parsed.components);
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
              Build, program, simulate, and verify circuits on Arduino, ESP32, Raspberry Pi Pico, and Raspberry Pi.
            </p>
          </div>

          {/* Controls: Project Actions & Submit */}
          <div className="flex flex-wrap items-center gap-2">
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

        {/* ========================================================= */}
        {/* HARDWARE PROGRAMMING PLATFORM SELECTOR */}
        {/* ========================================================= */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-500" />
                <span>HARDWARE PROGRAMMING</span>
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Microcontrollers and Single-Board Computers operate with distinct architectures. Select your target environment:
              </p>
            </div>

            {/* Architecture Details Badge */}
            <div className="flex items-center gap-2">
              {selectedCategory === 'arduino' && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-semibold">
                  Arduino Uno • ATmega328P 16MHz • 5V Logic
                </span>
              )}
              {selectedCategory === 'esp32' && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 font-semibold">
                  ESP32 DevKit • Dual-Core 240MHz • Wi-Fi/BLE • 3.3V Logic
                </span>
              )}
              {selectedCategory === 'pico' && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                  Raspberry Pi Pico • RP2040 Microcontroller • MicroPython & C/C++
                </span>
              )}
              {selectedCategory === 'raspberry_pi' && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold">
                  Raspberry Pi • Linux Single-Board Computer • Python & Linux C/C++
                </span>
              )}
              {selectedCategory === 'blocks' && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                  Visual Block Coding • Logic Blocks to C++ Sketch
                </span>
              )}
              {selectedCategory === 'hybrid' && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 font-semibold">
                  Hybrid Coding • Synchronized Blocks & Real-Time Code
                </span>
              )}
            </div>
          </div>

          {/* 6 SEPARATE PLATFORM BUTTONS */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => handleSelectHardwareCategory('arduino')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                selectedCategory === 'arduino'
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:border-[var(--muted-text)]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>[ Arduino ]</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectHardwareCategory('esp32')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                selectedCategory === 'esp32'
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:border-[var(--muted-text)]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>[ ESP32 ]</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectHardwareCategory('pico')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                selectedCategory === 'pico'
                  ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:border-emerald-500'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>[ Raspberry Pi Pico ]</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectHardwareCategory('raspberry_pi')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                selectedCategory === 'raspberry_pi'
                  ? 'border-rose-500 bg-rose-600 text-white shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:border-rose-500'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>[ Raspberry Pi ]</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectHardwareCategory('blocks')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                selectedCategory === 'blocks'
                  ? 'border-amber-500 bg-amber-600 text-white shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:border-amber-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>[ Block Coding ]</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectHardwareCategory('hybrid')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                selectedCategory === 'hybrid'
                  ? 'border-purple-500 bg-purple-600 text-white shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:border-purple-500'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>[ Hybrid Coding ]</span>
            </button>
          </div>
        </div>

        {/* Course Labs Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Structured Labs:</span>
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
            {selectedCategory === 'blocks' ? (
              <BlocklyEditor
                board={selectedBoard}
                blocks={blocks}
                onChangeBlocks={setBlocks}
                onGenerateCode={(generated) => setCode(generated)}
              />
            ) : selectedCategory === 'hybrid' ? (
              <HybridEditor
                board={selectedBoard}
                blocks={blocks}
                onChangeBlocks={setBlocks}
                generatedCode={code}
                onCodeUpdated={(updated) => setCode(updated)}
              />
            ) : (
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
                onNewProgram={handleNewProgram}
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
              onChangeBoard={(newB) => {
                setSelectedBoard(newB);
                if (newB === 'rp2040_pico') {
                  setSelectedCategory('pico');
                  setEditorMode('micropython');
                } else if (newB === 'raspberry_pi') {
                  setSelectedCategory('raspberry_pi');
                  setEditorMode('python');
                } else if (newB === 'arduino_uno') {
                  setSelectedCategory('arduino');
                  setEditorMode('arduino_c');
                } else if (newB === 'esp32') {
                  setSelectedCategory('esp32');
                  setEditorMode('arduino_c');
                }
              }}
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
