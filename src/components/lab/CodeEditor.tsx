import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  Copy,
  Download,
  Save,
  FolderOpen,
  Code,
  FileCode,
  Sparkles,
  AlertCircle,
  Check,
  Cpu,
  Plus,
  Terminal,
} from 'lucide-react';
import { HardwareBoard, CodingLabLanguage } from '../../types';

interface CodeEditorProps {
  board: HardwareBoard;
  code: string;
  onChangeCode: (newCode: string) => void;
  onRunSimulation: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  isSimulating: boolean;
  onSaveProject?: () => void;
  className?: string;
  language?: CodingLabLanguage;
  onChangeLanguage?: (newLang: CodingLabLanguage) => void;
  onNewProgram?: () => void;
  terminalLogs?: string[];
}

const EXAMPLE_PROGRAMS: Record<HardwareBoard, { title: string; code: string }[]> = {
  esp32: [
    {
      title: 'Blink Built-in LED',
      code: `// Innolink Technologies - ESP32 Built-in LED Blink
#define LED_PIN 2

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32 Lab initialized! Ready to blink.");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED State: HIGH (3.3V)");
  delay(1000);

  digitalWrite(LED_PIN, LOW);
  Serial.println("LED State: LOW (0V)");
  delay(1000);
}`,
    },
    {
      title: 'PWM LED Fading',
      code: `// Innolink Technologies - ESP32 PWM Fading
#define LED_PIN 2
#define PWM_CHANNEL 0
#define PWM_FREQ 5000
#define PWM_RES 8

void setup() {
  Serial.begin(115200);
  ledcAttach(LED_PIN, PWM_FREQ, PWM_RES);
  Serial.println("ESP32 PWM fading active.");
}

void loop() {
  for (int duty = 0; duty <= 255; duty += 5) {
    ledcWrite(LED_PIN, duty);
    delay(20);
  }
  for (int duty = 255; duty >= 0; duty -= 5) {
    ledcWrite(LED_PIN, duty);
    delay(20);
  }
}`,
    },
    {
      title: 'Analog Potentiometer & Serial Monitor',
      code: `// Innolink Technologies - ESP32 ADC Reading
#define POT_PIN 34
#define LED_PIN 2

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("ESP32 ADC Potentiometer reader started.");
}

void loop() {
  int rawValue = analogRead(POT_PIN);
  float voltage = (rawValue / 4095.0) * 3.3;

  Serial.print("Raw ADC: ");
  Serial.print(rawValue);
  Serial.print(" | Voltage: ");
  Serial.print(voltage, 2);
  Serial.println(" V");

  if (voltage > 1.65) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(500);
}`,
    },
  ],
  arduino_uno: [
    {
      title: 'Classic Arduino Blink (Pin 13)',
      code: `// Innolink Technologies - Arduino Uno Classic Blink
const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Arduino Uno Ready!");
}

void loop() {
  digitalWrite(ledPin, HIGH);
  Serial.println("LED ON");
  delay(1000);
  digitalWrite(ledPin, LOW);
  Serial.println("LED OFF");
  delay(1000);
}`,
    },
    {
      title: 'Ultrasonic Distance Sensor (HC-SR04)',
      code: `// Innolink Technologies - Arduino Uno HC-SR04 Distance Sensor
const int trigPin = 9;
const int echoPin = 10;
const int buzzerPin = 8;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Ultrasonic Obstacle Detection Active.");
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  int distanceCm = duration * 0.034 / 2;

  Serial.print("Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");

  if (distanceCm < 20 && distanceCm > 0) {
    digitalWrite(buzzerPin, HIGH);
  } else {
    digitalWrite(buzzerPin, LOW);
  }
  delay(250);
}`,
    },
  ],
  rp2040_pico: [
    {
      title: 'Pico MicroPython Onboard LED & Timer',
      code: `# Innolink Technologies - Raspberry Pi Pico (RP2040) MicroPython
import machine
import time

# Onboard LED (GP25 on Pico)
led = machine.Pin(25, machine.Pin.OUT)
adc = machine.ADC(4) # Internal temperature sensor

print("Raspberry Pi Pico MicroPython Initialized.")
print("RP2040 Dual ARM Cortex-M0+ running at 133 MHz.")

while True:
    led.value(1)
    raw = adc.read_u16()
    voltage = raw * (3.3 / 65535)
    temp_c = 27 - (voltage - 0.706) / 0.001721
    print(f"[PICO GP25] LED: ON | Core Temp: {temp_c:.1f}°C")
    time.sleep(1)

    led.value(0)
    print("[PICO GP25] LED: OFF")
    time.sleep(1)
`,
    },
    {
      title: 'Pico C/C++ SDK GPIO Blink',
      code: `// Innolink Technologies - Raspberry Pi Pico (RP2040) C/C++ SDK
#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/gpio.h"

#define PICO_LED_PIN 25

int main() {
  stdio_init_all();
  gpio_init(PICO_LED_PIN);
  gpio_set_dir(PICO_LED_PIN, GPIO_OUT);

  printf("Raspberry Pi Pico RP2040 C/C++ Firmware Booted!\\n");
  printf("Target: Dual ARM Cortex-M0+ (133 MHz)\\n");

  while (true) {
    gpio_put(PICO_LED_PIN, 1);
    printf("[RP2040] GPIO 25 -> HIGH (3.3V)\\n");
    sleep_ms(1000);

    gpio_put(PICO_LED_PIN, 0);
    printf("[RP2040] GPIO 25 -> LOW (0V)\\n");
    sleep_ms(1000);
  }
  return 0;
}`,
    },
    {
      title: 'Pico PWM Fading & Button Interrupt',
      code: `# Innolink Technologies - Pico MicroPython PWM & Button
import machine
import time

pwm_led = machine.PWM(machine.Pin(15))
pwm_led.freq(1000)
button = machine.Pin(14, machine.Pin.IN, machine.Pin.PULL_DOWN)

print("Raspberry Pi Pico PWM & GPIO Input Active.")

while True:
    if button.value() == 1:
        print("[PICO GP14] Button Pressed! Ramp to MAX brightness")
        pwm_led.duty_u16(65535)
        time.sleep(0.5)
    else:
        for duty in range(0, 65535, 2000):
            pwm_led.duty_u16(duty)
            time.sleep_ms(20)
        for duty in range(65535, 0, -2000):
            pwm_led.duty_u16(duty)
            time.sleep_ms(20)
`,
    },
    {
      title: '✨ [Blank] Custom Pico MicroPython Script',
      code: `# Raspberry Pi Pico (RP2040) - Custom MicroPython Script
# Write your own microcontroller program from scratch:
import machine
import time

# GP25 is the onboard LED on the Raspberry Pi Pico
led = machine.Pin(25, machine.Pin.OUT)

print("Raspberry Pi Pico Microcontroller Online.")
print("RP2040 running custom student MicroPython program.")

while True:
    led.toggle()
    print("Pico onboard LED toggled!")
    time.sleep(1)
`,
    },
    {
      title: '✨ [Blank] Custom Pico C/C++ SDK Program',
      code: `// Raspberry Pi Pico (RP2040) - Custom C/C++ Program
#include <stdio.h>
#include "pico/stdlib.h"

#define PICO_LED_PIN 25

int main() {
  stdio_init_all();
  gpio_init(PICO_LED_PIN);
  gpio_set_dir(PICO_LED_PIN, GPIO_OUT);

  printf("Raspberry Pi Pico RP2040 C/C++ Custom Program Booted!\\n");

  while (true) {
    gpio_put(PICO_LED_PIN, 1);
    printf("Pico GP25 -> HIGH (3.3V)\\n");
    sleep_ms(1000);

    gpio_put(PICO_LED_PIN, 0);
    printf("Pico GP25 -> LOW (0V)\\n");
    sleep_ms(1000);
  }
  return 0;
}
`,
    },
  ],
  raspberry_pi: [
    {
      title: 'Raspberry Pi Linux Python (RPi.GPIO / gpiozero)',
      code: `#!/usr/bin/env python3
# Innolink Technologies - Raspberry Pi Linux SBC (Python)
import time
import os

print(f"Host: Linux raspberrypi 6.1.0-rpi4-arm64 (Debian GNU/Linux)")
print(f"CPU: Broadcom BCM2711 Quad-Core Cortex-A72 @ 1.8GHz")
print(f"Python 3.11 Environment Initialized.")

# Simulated GPIO setup on Linux 40-Pin Header
LED_PIN = 17   # Physical Pin 11
BUTTON_PIN = 27 # Physical Pin 13

print(f"Configuring GPIO {LED_PIN} as OUTPUT...")
print(f"Configuring GPIO {BUTTON_PIN} as INPUT with pull-up...")

def loop():
    for cycle in range(1, 6):
        print(f"[Linux GPIO {LED_PIN}] State -> HIGH (3.3V) | Active Process PID: {os.getpid()}")
        time.sleep(1.0)
        print(f"[Linux GPIO {LED_PIN}] State -> LOW (0V)")
        time.sleep(1.0)
    print("Execution complete. Daemon listening for I/O events.")

if __name__ == "__main__":
    loop()
`,
    },
    {
      title: 'Raspberry Pi Linux C/C++ (libgpiod / POSIX)',
      code: `// Innolink Technologies - Raspberry Pi Linux C/C++ System Programming
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <time.h>

#define GPIO_PIN 18 // Hardware PWM / GPIO 18 (Pin 12)

int main(int argc, char *argv[]) {
  printf("=========================================\\n");
  printf(" Raspberry Pi Linux SBC Native C Runtime\\n");
  printf(" Architecture: aarch64 (ARMv8 64-bit)\\n");
  printf(" Linux Kernel: 6.6.20+rpt-rpi-v8\\n");
  printf("=========================================\\n");

  printf("Exporting GPIO line %d via Linux sysfs / libgpiod...\\n", GPIO_PIN);

  for (int i = 0; i < 5; i++) {
    printf("[POSIX /dev/gpiochip0] Pin %d -> HIGH (3.3V)\\n", GPIO_PIN);
    usleep(1000000); // 1000ms delay

    printf("[POSIX /dev/gpiochip0] Pin %d -> LOW (0V)\\n", GPIO_PIN);
    usleep(1000000); // 1000ms delay
  }

  printf("Linux process exited successfully (code 0).\\n");
  return 0;
}
`,
    },
    {
      title: 'Raspberry Pi Python System Monitor & Sensor Daemon',
      code: `#!/usr/bin/env python3
# Innolink Technologies - Raspberry Pi System Telemetry & GPIO
import time
import os

print("Starting Raspberry Pi Telemetry Daemon...")

def get_cpu_temp():
    # Simulated vcgencmd measure_temp on Linux
    return 42.8

def get_memory_info():
    return {"total": "4096 MB", "free": "2810 MB"}

print(f"Memory: {get_memory_info()['free']} free of {get_memory_info()['total']}")
print(f"SoC Thermal Sensor: {get_cpu_temp()}°C")

for step in range(1, 6):
    temp = get_cpu_temp() + (step * 0.4)
    print(f"[Telemetrics] Step {step}: CPU {temp:.1f}°C | GPIO Pin 24: ACTIVE")
    time.sleep(1)

print("Telemetry daemon standing by.")
`,
    },
    {
      title: '✨ [Blank] Custom Raspberry Pi Python Program',
      code: `#!/usr/bin/env python3
# Raspberry Pi Single-Board Computer (Linux OS) - Custom Student Script
import time
import os

print(f"==================================================")
print(f" Linux raspberrypi 6.6.20-v8+ (Debian GNU/Linux)")
print(f" Broadcom BCM2711 Quad ARM Cortex-A72 @ 1.8GHz")
print(f" PID: {os.getpid()} | Student Environment Active")
print(f"==================================================")

# Write your custom Python or GPIO automation code below:
LED_PIN = 17 # GPIO 17 (Pin 11 on 40-pin header)

for cycle in range(1, 6):
    print(f"[Linux GPIO {LED_PIN}] Signal -> HIGH (3.3V) | Cycle {cycle}")
    time.sleep(1.0)
    print(f"[Linux GPIO {LED_PIN}] Signal -> LOW (0V)")
    time.sleep(1.0)

print("Program execution completed.")
`,
    },
    {
      title: '✨ [Blank] Custom Raspberry Pi Linux C/C++ Program',
      code: `// Raspberry Pi Single-Board Computer - Custom Linux C/C++ Binary
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
  printf("=========================================\\n");
  printf(" Raspberry Pi Native Linux C Execution\\n");
  printf(" Host: Linux aarch64 (ARMv8 64-bit SBC)\\n");
  printf("=========================================\\n");

  for (int i = 1; i <= 5; i++) {
    printf("[Linux Worker] Running loop step %d of 5...\\n", i);
    sleep(1);
  }

  printf("Native Linux binary exited with code 0.\\n");
  return 0;
}
`,
    },
  ],
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  board,
  code,
  onChangeCode,
  onRunSimulation,
  onStopSimulation,
  onResetSimulation,
  isSimulating,
  onSaveProject,
  className = '',
  language = 'arduino_c',
  onChangeLanguage,
  onNewProgram,
  terminalLogs = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [compileStatus, setCompileStatus] = useState<'idle' | 'checking' | 'passed' | 'error'>('idle');
  const [compileMessage, setCompileMessage] = useState<string>('');
  const [showExamples, setShowExamples] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'terminal'>('editor');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Linux raspberrypi 6.6.20+rpt-rpi-v8 #1 SMP PREEMPT Debian 1:6.6.20-1 (aarch64)',
    'Welcome to Raspberry Pi OS (Debian Bookworm GNU/Linux).',
    'Broadcom BCM2711 Quad-Core Cortex-A72 @ 1.8GHz | 4GB LPDDR4-3200',
    'Type "python3 main.py" or run simulation to execute scripts.',
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Sync external simulation logs into terminal history when on Raspberry Pi
  useEffect(() => {
    if (board === 'raspberry_pi' && terminalLogs.length > 0) {
      setTerminalHistory((prev) => {
        const lastLog = terminalLogs[terminalLogs.length - 1];
        if (prev[prev.length - 1] !== lastLog) {
          return [...prev, lastLog].slice(-50);
        }
        return prev;
      });
    }
  }, [board, terminalLogs]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  // Line numbers calculation
  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let extension = 'ino';
    if (board === 'raspberry_pi') {
      extension = code.includes('#include') ? 'c' : 'py';
    } else if (board === 'rp2040_pico') {
      extension = code.includes('#include') ? 'c' : 'py';
    } else if (language === 'micropython' || code.includes('import machine')) {
      extension = 'py';
    }
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Innolink_${board}_project.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateBlankProgram = () => {
    if (onNewProgram) {
      onNewProgram();
      return;
    }

    if (board === 'rp2040_pico') {
      if (language === 'c_cpp' || code.includes('#include')) {
        onChangeCode(`// Raspberry Pi Pico (RP2040) - Custom C/C++ SDK Program
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
}`);
      } else {
        onChangeCode(`# Raspberry Pi Pico (RP2040) - Custom MicroPython Script
import machine
import time

# Onboard LED on Raspberry Pi Pico is GP25
led = machine.Pin(25, machine.Pin.OUT)
print("Raspberry Pi Pico Microcontroller Online.")

while True:
    led.toggle()
    print("Pico GP25 toggled!")
    time.sleep(1)`);
      }
    } else if (board === 'raspberry_pi') {
      if (language === 'c_cpp' || code.includes('#include')) {
        onChangeCode(`// Raspberry Pi Single-Board Computer - Custom Linux C/C++ Program
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
}`);
      } else {
        onChangeCode(`#!/usr/bin/env python3
# Raspberry Pi Single-Board Computer (Linux OS) - Custom Student Script
import time
import os

print(f"Linux raspberrypi 6.6.20-v8+ (Debian GNU/Linux)")
print(f"Broadcom BCM2711 Quad ARM Cortex-A72 @ 1.8GHz | PID: {os.getpid()}")

# GPIO 17 on the 40-Pin Header (Physical Pin 11)
LED_PIN = 17
print(f"Controlling GPIO {LED_PIN}...")

for cycle in range(1, 6):
    print(f"[Linux GPIO {LED_PIN}] Signal -> HIGH (3.3V) | Cycle {cycle}")
    time.sleep(1.0)
    print(f"[Linux GPIO {LED_PIN}] Signal -> LOW (0V)")
    time.sleep(1.0)

print("Custom script finished.")`);
      }
    } else if (board === 'esp32') {
      onChangeCode(`// ESP32 DevKit V1 - Custom Student Program
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
      onChangeCode(`// Arduino Uno R3 - Custom Student Sketch
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
  };

  const handleCompileCheck = () => {
    setCompileStatus('checking');
    setTimeout(() => {
      const trimmed = code.trim();
      const isPythonCode =
        (board === 'rp2040_pico' && (trimmed.startsWith('import ') || trimmed.startsWith('#'))) ||
        (board === 'raspberry_pi' && (trimmed.startsWith('#!') || trimmed.startsWith('import ') || trimmed.startsWith('#') || trimmed.includes('def ')));

      if (isPythonCode) {
        if (!trimmed.includes(':') && (trimmed.includes('while ') || trimmed.includes('for ') || trimmed.includes('if '))) {
          setCompileStatus('error');
          setCompileMessage('Syntax Note: Expected colon (:) after control statement (for/while/if).');
          return;
        }
      } else {
        // C/C++ checks
        const openBraces = (code.match(/{/g) || []).length;
        const closeBraces = (code.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          setCompileStatus('error');
          setCompileMessage(`Mismatched braces: ${openBraces} opening '{' vs ${closeBraces} closing '}'.`);
          return;
        }
        if (!code.includes('setup') && !code.includes('main')) {
          setCompileStatus('error');
          setCompileMessage("Compilation Error: Missing 'void setup()' or 'int main()' entrypoint.");
          return;
        }
      }

      setCompileStatus('passed');
      setCompileMessage(`Code verified successfully for ${board.toUpperCase()}. Ready to simulate.`);
      setTimeout(() => setCompileStatus('idle'), 4000);
    }, 450);
  };

  const handleInsertExample = (exampleCode: string) => {
    onChangeCode(exampleCode);
    setShowExamples(false);
  };

  const handleRunTerminalCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    setTerminalInput('');

    const newLogs = [`pi@raspberrypi:~$ ${trimmed}`];

    if (trimmed === 'clear') {
      setTerminalHistory([]);
      return;
    } else if (trimmed === 'uname -a') {
      newLogs.push('Linux raspberrypi 6.6.20+rpt-rpi-v8 #1 SMP PREEMPT Debian 1:6.6.20-1 (2024-03-15) aarch64 GNU/Linux');
    } else if (trimmed === 'vcgencmd measure_temp') {
      newLogs.push(`temp=43.2'C`);
    } else if (trimmed === 'pinout') {
      newLogs.push(
        'Raspberry Pi 4B 40-Pin GPIO Header Map:\n 3V3  (1) (2)  5V\n GPIO2 (3) (4)  5V\n GPIO3 (5) (6)  GND\n GPIO4 (7) (8)  GPIO14\n  GND  (9) (10) GPIO15\nGPIO17 (11) (12) GPIO18\nGPIO27 (13) (14) GND'
      );
    } else if (trimmed.startsWith('python') || trimmed.includes('main.py')) {
      newLogs.push(`[Python 3.11] Executing student script (PID ${Math.floor(Math.random() * 8000 + 1000)})...`);
      onRunSimulation();
    } else if (trimmed.includes('gcc') || trimmed.includes('./')) {
      newLogs.push(`[GCC 12.2] Compiling C source on aarch64... Binary executing...`);
      onRunSimulation();
    } else {
      newLogs.push(`Command '${trimmed}' executed. Target process running.`);
    }

    setTerminalHistory((prev) => [...prev, ...newLogs]);
  };

  return (
    <div className={`flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${className}`}>
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-2">
          {/* Board Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase font-semibold">
              {board === 'rp2040_pico'
                ? 'Raspberry Pi Pico (RP2040 MCU)'
                : board === 'raspberry_pi'
                ? 'Raspberry Pi 4 / 5 (Linux SBC)'
                : board.replace('_', ' ')}
            </span>
          </div>

          {/* Languages Supported per Platform */}
          {board === 'rp2040_pico' && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  onChangeLanguage?.('micropython');
                  if (code.includes('#include')) {
                    handleInsertExample(EXAMPLE_PROGRAMS.rp2040_pico[0].code);
                  }
                }}
                className={`px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                  !code.includes('#include')
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MicroPython
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeLanguage?.('c_cpp');
                  if (!code.includes('#include')) {
                    handleInsertExample(EXAMPLE_PROGRAMS.rp2040_pico[1].code);
                  }
                }}
                className={`px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                  code.includes('#include')
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                C/C++ SDK
              </button>
            </div>
          )}

          {board === 'raspberry_pi' && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  onChangeLanguage?.('python');
                  if (code.includes('#include')) {
                    handleInsertExample(EXAMPLE_PROGRAMS.raspberry_pi[0].code);
                  }
                }}
                className={`px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                  !code.includes('#include')
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Python (RPi.GPIO)
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeLanguage?.('c_cpp');
                  if (!code.includes('#include')) {
                    handleInsertExample(EXAMPLE_PROGRAMS.raspberry_pi[1].code);
                  }
                }}
                className={`px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                  code.includes('#include')
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Linux C/C++
              </button>
            </div>
          )}

          {/* Linux SBC Terminal Toggle Button for Raspberry Pi */}
          {board === 'raspberry_pi' && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setActiveView('editor')}
                className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                  activeView === 'editor'
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('terminal')}
                className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 ${
                  activeView === 'terminal'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Linux Terminal</span>
              </button>
            </div>
          )}

          {/* NEW / CUSTOM PROGRAM BUTTON (Student freedom) */}
          <button
            type="button"
            onClick={handleCreateBlankProgram}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300 transition cursor-pointer text-[11px] font-medium"
            title="Create a new blank program to write your own custom code"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Custom Program</span>
          </button>

          {/* Example Programs Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer text-[11px]"
            >
              <FolderOpen className="w-3 h-3 text-cyan-400" />
              <span>Examples & Templates</span>
            </button>

            {showExamples && (
              <div className="absolute left-0 mt-1 w-72 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-30">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 block">
                  Select {board.toUpperCase()} Program
                </span>
                {EXAMPLE_PROGRAMS[board]?.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertExample(ex.code)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-400 transition"
                  >
                    {ex.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onSaveProject && (
            <button
              type="button"
              onClick={onSaveProject}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition cursor-pointer text-[11px]"
            >
              <Save className="w-3 h-3 text-emerald-400" />
              <span>Save</span>
            </button>
          )}
        </div>

        {/* Action Controls: Compile, Run, Stop, Copy, Download */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCompileCheck}
            disabled={compileStatus === 'checking'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer text-[11px]"
            title="Check Code Syntax"
          >
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Check</span>
          </button>

          {!isSimulating ? (
            <button
              type="button"
              onClick={() => {
                onRunSimulation();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{board === 'raspberry_pi' ? 'Execute in Linux' : 'Run Simulation'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopSimulation}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition cursor-pointer shadow-md shadow-rose-600/20"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetSimulation}
            className="p-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Reset Board & Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Download Code File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compiler feedback toast */}
      {compileStatus !== 'idle' && (
        <div
          className={`px-3 py-1.5 text-xs flex items-center gap-2 border-b ${
            compileStatus === 'passed'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              : compileStatus === 'error'
              ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
              : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
          }`}
        >
          {compileStatus === 'passed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          {compileStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
          {compileStatus === 'checking' && <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" />}
          <span>{compileMessage || 'Analyzing program syntax...'}</span>
        </div>
      )}

      {/* 2. Main Workspace: Either Code Editor or Linux Terminal */}
      {activeView === 'editor' ? (
        <div className="relative flex-1 flex min-h-[360px] max-h-[540px] font-mono text-xs overflow-auto">
          {/* Line Numbers Bar */}
          <div className="select-none py-3 px-2 bg-slate-950/90 text-slate-600 text-right font-mono text-[11px] border-r border-slate-900 w-10 shrink-0">
            {lineNumbers.map((num) => (
              <div key={num} className="leading-5">
                {num}
              </div>
            ))}
          </div>

          {/* Textarea code editor */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-slate-950 text-cyan-100 p-3 leading-5 resize-none focus:outline-none focus:ring-0 font-mono text-xs selection:bg-cyan-500/30"
            placeholder={
              board === 'rp2040_pico'
                ? '# Write your Raspberry Pi Pico MicroPython or C/C++ program here...'
                : board === 'raspberry_pi'
                ? '# Write your Raspberry Pi Linux Python or C/C++ program here...'
                : '// Write your Arduino / ESP32 C++ program here...'
            }
          />
        </div>
      ) : (
        /* Linux Terminal Shell for Raspberry Pi Single-Board Computer */
        <div className="flex-1 flex flex-col min-h-[360px] max-h-[540px] bg-black text-emerald-400 font-mono text-xs p-3 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/50 text-[11px] text-emerald-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-emerald-400 font-bold">pi@raspberrypi:~ (Linux bash)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRunTerminalCommand('pinout')}
                className="hover:text-emerald-300 text-[10px] cursor-pointer"
              >
                [pinout]
              </button>
              <button
                type="button"
                onClick={() => handleRunTerminalCommand('vcgencmd measure_temp')}
                className="hover:text-emerald-300 text-[10px] cursor-pointer"
              >
                [temp]
              </button>
              <button
                type="button"
                onClick={() => setTerminalHistory([])}
                className="hover:text-emerald-300 text-[10px] cursor-pointer"
              >
                [clear]
              </button>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="flex-1 overflow-y-auto py-2 space-y-1 select-text">
            {terminalHistory.map((line, idx) => (
              <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                {line}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Interactive Shell Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunTerminalCommand(terminalInput);
            }}
            className="flex items-center gap-2 pt-2 border-t border-emerald-900/50"
          >
            <span className="text-emerald-500 font-bold shrink-0">pi@raspberrypi:~$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="e.g. python3 main.py, pinout, uname -a..."
              className="flex-1 bg-transparent text-emerald-300 font-mono text-xs focus:outline-none"
            />
          </form>
        </div>
      )}

      {/* 3. Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>Lines: {lineCount}</span>
          <span>Chars: {code.length}</span>
          <span className="text-cyan-400">Target: {board.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          {isSimulating ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Simulation Running</span>
            </span>
          ) : (
            <span className="text-slate-500">Ready</span>
          )}
        </div>
      </div>
    </div>
  );
};
