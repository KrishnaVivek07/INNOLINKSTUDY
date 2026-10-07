import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { HardwareBoard } from '../../types';

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
      title: 'Pico C/C++ Onboard LED Blink',
      code: `// Innolink Technologies - Raspberry Pi Pico (RP2040)
#include <stdio.h>
#include "pico/stdlib.h"

#define PICO_LED_PIN 25

int main() {
  stdio_init_all();
  gpio_init(PICO_LED_PIN);
  gpio_set_dir(PICO_LED_PIN, GPIO_OUT);

  printf("Raspberry Pi Pico RP2040 Booted!\\n");

  while (true) {
    gpio_put(PICO_LED_PIN, 1);
    printf("Pico LED ON (GP25)\\n");
    sleep_ms(1000);

    gpio_put(PICO_LED_PIN, 0);
    printf("Pico LED OFF (GP25)\\n");
    sleep_ms(1000);
  }
  return 0;
}`,
    },
    {
      title: 'Pico MicroPython Blink & ADC',
      code: `# Innolink Technologies - Raspberry Pi Pico MicroPython
import machine
import time

led = machine.Pin(25, machine.Pin.OUT)
adc = machine.ADC(4) # Internal temperature sensor

print("Raspberry Pi Pico MicroPython initialized.")

while True:
    led.value(1)
    raw = adc.read_u16()
    voltage = raw * (3.3 / 65535)
    temp_c = 27 - (voltage - 0.706) / 0.001721
    print(f"Pico Temp: {temp_c:.1f}°C | LED: ON")
    time.sleep(1)
    
    led.value(0)
    print("LED: OFF")
    time.sleep(1)
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
}) => {
  const [copied, setCopied] = useState(false);
  const [compileStatus, setCompileStatus] = useState<'idle' | 'checking' | 'passed' | 'error'>('idle');
  const [compileMessage, setCompileMessage] = useState<string>('');
  const [showExamples, setShowExamples] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Line numbers calculation
  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension = board === 'rp2040_pico' && code.includes('import ') ? 'py' : 'ino';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Innolink_${board}_project.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCompileCheck = () => {
    setCompileStatus('checking');
    setTimeout(() => {
      // Basic static syntax verification
      const trimmed = code.trim();
      const isPython = board === 'rp2040_pico' && (trimmed.startsWith('import ') || trimmed.startsWith('#'));

      if (isPython) {
        if (!trimmed.includes(':') && trimmed.includes('while')) {
          setCompileStatus('error');
          setCompileMessage('Syntax Note: Expected colon (:) after control statement.');
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

  return (
    <div className={`flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${className}`}>
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase font-semibold">{board.replace('_', ' ')}</span>
          </div>

          {/* Example Programs Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer text-[11px]"
            >
              <FolderOpen className="w-3 h-3 text-cyan-400" />
              <span>Examples</span>
            </button>

            {showExamples && (
              <div className="absolute left-0 mt-1 w-64 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-30">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 block">
                  Select {board.toUpperCase()} Example
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
              <span>Run Simulation</span>
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

      {/* Editor Main Canvas with Line Numbers */}
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
          placeholder="// Write your Arduino C++ or MicroPython program here..."
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>Lines: {lineCount}</span>
          <span>Chars: {code.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {isSimulating ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Simulation Active</span>
            </span>
          ) : (
            <span className="text-slate-500">Ready</span>
          )}
        </div>
      </div>
    </div>
  );
};
