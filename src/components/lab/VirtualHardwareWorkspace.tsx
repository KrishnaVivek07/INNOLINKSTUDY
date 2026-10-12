import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Layers,
  Sliders,
  Radio,
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Terminal,
  Activity,
  Zap,
  Info,
  ExternalLink,
  Settings,
  Volume2,
  Gauge,
  Thermometer,
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Sparkles,
  Search,
  SlidersHorizontal,
  Copy,
  RotateCw,
  Compass,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { HardwareBoard, SimulatedComponent, CircuitWire } from '../../types';
import { BOARD_REGISTRY } from '../../lib/boardRegistry';
import { validateAndSimulateCircuit, SimulationDiagnostic } from '../../lib/circuitEngine';
import { InteractiveBreadboardCanvas } from './InteractiveBreadboardCanvas';
import { SearchableBoardSelector } from './SearchableBoardSelector';

export interface StarterCircuit {
  id: string;
  title: string;
  board: HardwareBoard;
  code: string;
  components: SimulatedComponent[];
  wires: CircuitWire[];
}

export const STARTER_CIRCUITS: StarterCircuit[] = [
  {
    id: 'starter_blink',
    title: '1. LED Blink (Arduino Uno)',
    board: 'arduino_uno',
    code: `// Arduino Uno Classic LED Blink
const int ledPin = 2;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Arduino Uno LED Blink sketch started.");
}

void loop() {
  digitalWrite(ledPin, HIGH);
  Serial.println("LED ON (5V)");
  delay(1000);
  digitalWrite(ledPin, LOW);
  Serial.println("LED OFF (0V)");
  delay(1000);
}`,
    components: [
      {
        id: 'c1',
        type: 'led' as const,
        label: 'Red 5mm LED',
        color: 'red',
        state: { pin: '2', digitalValue: false },
        pins: { anode: '2', cathode: 'GND' },
      },
      {
        id: 'c2',
        type: 'resistor' as const,
        label: '220Ω Resistor',
        state: { pin: '2' },
        pins: { pin1: '2', pin2: 'GND' },
      },
    ],
    wires: [
      {
        id: 'w1',
        from: { type: 'board' as const, pinId: '2', label: 'Arduino D2' },
        to: { type: 'component' as const, componentId: 'c1', pinId: 'anode', label: 'LED Anode (+)' },
        color: 'red' as const,
      },
      {
        id: 'w2',
        from: { type: 'component' as const, componentId: 'c1', pinId: 'cathode', label: 'LED Cathode (-)' },
        to: { type: 'component' as const, componentId: 'c2', pinId: 'pin1', label: 'Resistor Pin 1' },
        color: 'yellow' as const,
      },
      {
        id: 'w3',
        from: { type: 'component' as const, componentId: 'c2', pinId: 'pin2', label: 'Resistor Pin 2' },
        to: { type: 'board' as const, pinId: 'GND', label: 'Arduino GND' },
        color: 'black' as const,
      },
    ],
  },
  {
    id: 'starter_button',
    title: '2. Push Button Controlled LED',
    board: 'arduino_uno',
    code: `// Arduino Button Controlled LED
const int ledPin = 2;
const int buttonPin = 4;

void setup() {
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT);
  Serial.begin(9600);
  Serial.println("Button LED system initialized.");
}

void loop() {
  int buttonState = digitalRead(buttonPin);
  if (buttonState == HIGH) {
    digitalWrite(ledPin, HIGH);
    Serial.println("Button PRESSED -> LED ON");
  } else {
    digitalWrite(ledPin, LOW);
  }
  delay(100);
}`,
    components: [
      {
        id: 'c1',
        type: 'led' as const,
        label: 'Green 5mm LED',
        color: 'green',
        state: { pin: '2', digitalValue: false },
        pins: { anode: '2', cathode: 'GND' },
      },
      {
        id: 'c2',
        type: 'resistor' as const,
        label: '220Ω Resistor',
        pins: { pin1: '2', pin2: 'GND' },
      },
      {
        id: 'c3',
        type: 'push_button' as const,
        label: 'Tactile Push Button',
        state: { pin: '4', digitalValue: false },
        pins: { signal: '4', gnd: 'GND' },
      },
    ],
    wires: [
      {
        id: 'w1',
        from: { type: 'board' as const, pinId: '2', label: 'Arduino D2' },
        to: { type: 'component' as const, componentId: 'c1', pinId: 'anode', label: 'LED Anode (+)' },
        color: 'green' as const,
      },
      {
        id: 'w2',
        from: { type: 'component' as const, componentId: 'c1', pinId: 'cathode', label: 'LED Cathode (-)' },
        to: { type: 'board' as const, pinId: 'GND', label: 'Arduino GND' },
        color: 'black' as const,
      },
      {
        id: 'w3',
        from: { type: 'board' as const, pinId: '4', label: 'Arduino D4' },
        to: { type: 'component' as const, componentId: 'c3', pinId: 'signal', label: 'Button Signal' },
        color: 'blue' as const,
      },
      {
        id: 'w4',
        from: { type: 'component' as const, componentId: 'c3', pinId: 'gnd', label: 'Button GND' },
        to: { type: 'board' as const, pinId: 'GND', label: 'Arduino GND' },
        color: 'black' as const,
      },
    ],
  },
  {
    id: 'starter_ultrasonic',
    title: '3. Ultrasonic Distance & Buzzer Alarm (ESP32)',
    board: 'esp32',
    code: `// ESP32 Ultrasonic Distance & Audio Alarm
const int trigPin = 18;
const int echoPin = 19;
const int buzzerPin = 23;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32 Ultrasonic Radar online.");
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  int distanceCm = duration * 0.034 / 2;

  Serial.print("Target Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");

  if (distanceCm < 20) {
    digitalWrite(buzzerPin, HIGH);
    Serial.println("PROXIMITY WARNING: Obstacle within 20cm!");
  } else {
    digitalWrite(buzzerPin, LOW);
  }
  delay(500);
}`,
    components: [
      {
        id: 'c1',
        type: 'ultrasonic_sensor' as const,
        label: 'HC-SR04 Ultrasonic',
        state: { distance: 15 },
        pins: { vcc: '5V', trig: '18', echo: '19', gnd: 'GND' },
      },
      {
        id: 'c2',
        type: 'buzzer' as const,
        label: 'Piezo Alarm Buzzer',
        state: { pin: '23', digitalValue: false },
        pins: { pos: '23', neg: 'GND' },
      },
    ],
    wires: [
      {
        id: 'w1',
        from: { type: 'board' as const, pinId: '5V', label: 'ESP32 5V' },
        to: { type: 'component' as const, componentId: 'c1', pinId: 'vcc', label: 'Sensor VCC' },
        color: 'red' as const,
      },
      {
        id: 'w2',
        from: { type: 'board' as const, pinId: 'GND', label: 'ESP32 GND' },
        to: { type: 'component' as const, componentId: 'c1', pinId: 'gnd', label: 'Sensor GND' },
        color: 'black' as const,
      },
      {
        id: 'w3',
        from: { type: 'board' as const, pinId: '18', label: 'GPIO 18' },
        to: { type: 'component' as const, componentId: 'c1', pinId: 'signal', label: 'Trig' },
        color: 'blue' as const,
      },
      {
        id: 'w4',
        from: { type: 'board' as const, pinId: '23', label: 'GPIO 23' },
        to: { type: 'component' as const, componentId: 'c2', pinId: 'pos', label: 'Buzzer (+)' },
        color: 'orange' as const,
      },
      {
        id: 'w5',
        from: { type: 'component' as const, componentId: 'c2', pinId: 'neg', label: 'Buzzer (-)' },
        to: { type: 'board' as const, pinId: 'GND', label: 'ESP32 GND' },
        color: 'black' as const,
      },
    ],
  },
  {
    id: 'starter_potentiometer',
    title: '4. Potentiometer Dimmer (RP2040 Pico)',
    board: 'rp2040_pico',
    code: `# Raspberry Pi Pico MicroPython Analog Dimmer
import machine
import time

pot = machine.ADC(26)
led = machine.PWM(machine.Pin(25))
led.freq(1000)

print("Pico GP26 (ADC0) analog reading initialized.")

while True:
    val = pot.read_u16()
    led.duty_u16(val)
    voltage = (val / 65535) * 3.3
    print(f"Potentiometer Voltage: {voltage:.2f}V | PWM Duty: {val}")
    time.sleep(0.5)`,
    components: [
      {
        id: 'c1',
        type: 'potentiometer' as const,
        label: '10kΩ Potentiometer',
        state: { pin: 'GP26', analogValue: 512 },
        pins: { vcc: '3V3', signal: 'GP26', gnd: 'GND' },
      },
      {
        id: 'c2',
        type: 'led' as const,
        label: 'Blue 5mm LED',
        color: 'blue',
        state: { pin: 'GP25', digitalValue: true },
        pins: { anode: 'GP25', cathode: 'GND' },
      },
    ],
    wires: [
      {
        id: 'w1',
        from: { type: 'board' as const, pinId: '3V3', label: 'Pico 3.3V' },
        to: { type: 'component' as const, componentId: 'c1', pinId: 'vcc', label: 'Pot VCC' },
        color: 'red' as const,
      },
      {
        id: 'w2',
        from: { type: 'board' as const, pinId: 'GND', label: 'Pico GND' },
        to: { type: 'component' as const, componentId: 'c1', pinId: 'gnd', label: 'Pot GND' },
        color: 'black' as const,
      },
      {
        id: 'w3',
        from: { type: 'board' as const, pinId: 'GP26', label: 'Pico GP26' },
        to: { type: 'component' as const, componentId: 'c1', pinId: 'signal', label: 'Pot Wiper' },
        color: 'yellow' as const,
      },
    ],
  },
];

interface VirtualHardwareWorkspaceProps {
  board: HardwareBoard | string;
  onChangeBoard?: (newBoard: HardwareBoard) => void;
  components: SimulatedComponent[];
  onUpdateComponents: (comps: SimulatedComponent[]) => void;
  wires?: CircuitWire[];
  onUpdateWires?: (wires: CircuitWire[]) => void;
  onLoadStarterCircuit?: (starter: typeof STARTER_CIRCUITS[0]) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  serialLogs: string[];
  onClearSerial: () => void;
  onSendSerialInput: (input: string) => void;
  className?: string;
  recommendedKitId?: string;
  onNavigateToMarketplaceKit?: (kitId: string) => void;
}

export const COMPONENT_CATALOG = [
  // 1. Boards
  { type: 'arduino_uno' as const, label: 'Arduino Uno R3', category: 'Boards', defaultPin: '2', desc: 'ATmega328P, 14 Digital, 6 Analog' },
  { type: 'esp32' as const, label: 'ESP32 DevKit V1', category: 'Boards', defaultPin: '2', desc: 'Xtensa Dual-Core, Wi-Fi & Bluetooth' },
  { type: 'rp2040_pico' as const, label: 'Raspberry Pi Pico', category: 'Boards', defaultPin: 'GP25', desc: 'Dual ARM Cortex-M0+, MicroPython' },
  { type: 'raspberry_pi' as const, label: 'Raspberry Pi SBC', category: 'Boards', defaultPin: 'GPIO17', desc: '64-bit Linux Single-Board Computer' },
  // 2. Prototyping
  { type: 'resistor' as const, label: 'Half-Size Breadboard', category: 'Prototyping', defaultPin: '2', desc: '400 Tie-Point Solderless Breadboard' },
  { type: 'resistor' as const, label: '9V Alkaline Battery', category: 'Prototyping', defaultPin: 'VIN', desc: '9V DC Power Supply with Snap Leads' },
  // 3. Basic Electronic Components
  { type: 'resistor' as const, label: '220Ω Current Limiting Resistor', category: 'Basic', defaultPin: '2', desc: 'Red-Red-Brown 5% Carbon Film' },
  { type: 'resistor' as const, label: '1kΩ Pull-Up Resistor', category: 'Basic', defaultPin: '4', desc: 'Brown-Black-Red 5% Resistor' },
  { type: 'resistor' as const, label: '10kΩ Voltage Divider Resistor', category: 'Basic', defaultPin: 'A0', desc: 'Brown-Black-Orange 5% Resistor' },
  { type: 'led' as const, label: 'Red 5mm Diffused LED', category: 'Basic', defaultPin: '2', desc: '2.0V Forward Drop, 20mA' },
  { type: 'led' as const, label: 'Green 5mm Diffused LED', category: 'Basic', defaultPin: '3', desc: '2.2V Forward Drop, 20mA' },
  { type: 'led' as const, label: 'Blue 5mm Super-Bright LED', category: 'Basic', defaultPin: '5', desc: '3.2V Forward Drop, 20mA' },
  { type: 'rgb_led' as const, label: 'RGB LED (Common Cathode)', category: 'Basic', defaultPin: '3', desc: 'Red, Green, Blue in 5mm Package' },
  { type: 'push_button' as const, label: 'Tactile Push Button', category: 'Basic', defaultPin: '4', desc: '6x6mm Momentary Push Button' },
  { type: 'potentiometer' as const, label: '10kΩ Rotary Potentiometer', category: 'Basic', defaultPin: 'A0', desc: 'Rotary Trimpot / Analog Wiper' },
  // 4. Sensors & Inputs
  { type: 'ultrasonic_sensor' as const, label: 'HC-SR04 Ultrasonic Distance', category: 'Sensors', defaultPin: '9', desc: '2cm - 400cm Non-Contact Sonar' },
  { type: 'dht_sensor' as const, label: 'DHT11 Temp & Humidity Sensor', category: 'Sensors', defaultPin: '5', desc: 'Digital One-Wire Sensor' },
  { type: 'ldr' as const, label: 'LDR Photoresistor (Light)', category: 'Sensors', defaultPin: 'A1', desc: 'Cadmium Sulfide (CdS) Lux Sensor' },
  // 5. Outputs & Actuators
  { type: 'buzzer' as const, label: 'Piezoelectric Alarm Buzzer', category: 'Outputs', defaultPin: '8', desc: 'Active / PWM Tone Generator' },
  { type: 'servo' as const, label: 'SG90 Micro Servo (0-180°)', category: 'Outputs', defaultPin: '9', desc: 'PWM Angle Feedback Actuator' },
  { type: 'lcd_16x2' as const, label: '16x2 Character LCD (I2C)', category: 'Outputs', defaultPin: 'A4', desc: 'HD44780 with PCF8574 Backlight' },
  // 6. Test Equipment
  { type: 'multimeter' as const, label: 'Virtual Digital Multimeter', category: 'Test Equipment', defaultPin: 'A0', desc: 'Voltage, Current & Resistance Probe' },
];

export const VirtualHardwareWorkspace: React.FC<VirtualHardwareWorkspaceProps> = ({
  board,
  onChangeBoard,
  components,
  onUpdateComponents,
  wires,
  onUpdateWires,
  onLoadStarterCircuit,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  serialLogs,
  onClearSerial,
  onSendSerialInput,
  className = '',
  recommendedKitId,
  onNavigateToMarketplaceKit,
}) => {
  const [activeTab, setActiveTab] = useState<'workbench' | 'breadboard' | 'components' | 'instruments' | 'diagnostics' | 'serial' | 'pinout'>('workbench');
  const boardDef = BOARD_REGISTRY[board] || BOARD_REGISTRY.arduino_uno;
  const [serialInput, setSerialInput] = useState('');
  const serialEndRef = useRef<HTMLDivElement | null>(null);

  // Fallback internal wires state if not provided by parent
  const [internalWires, setInternalWires] = useState<CircuitWire[]>([]);
  const currentWires = wires !== undefined ? wires : internalWires;
  const handleUpdateWires = onUpdateWires || setInternalWires;

  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [libraryCategory, setLibraryCategory] = useState<string>('all');
  const [librarySearch, setLibrarySearch] = useState<string>('');
  
  // Test instruments state
  const [meterMode, setMeterMode] = useState<'volts' | 'amps' | 'ohms'>('volts');
  const [scopeTraceTime, setScopeTraceTime] = useState<number>(0);

  const serialContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef<boolean>(true);

  // Audio tone context for buzzer simulation
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Circuit diagnostics evaluation
  const validation = validateAndSimulateCircuit(board, components, isSimulating, currentWires);

  const selectedComponent = components.find((c) => c.id === selectedCompId);

  const handleSerialScroll = () => {
    if (!serialContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = serialContainerRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 35;
  };

  useEffect(() => {
    if (autoScrollRef.current && serialContainerRef.current) {
      serialContainerRef.current.scrollTop = serialContainerRef.current.scrollHeight;
    }
  }, [serialLogs]);

  // Audio feedback for buzzers during simulation
  useEffect(() => {
    if (!isSimulating) {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    const hasActiveBuzzer = Object.values(validation.activeOutputs.buzzers).some((b) => b.active);
    if (hasActiveBuzzer) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtx();
        }
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtxRef.current.currentTime);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.15);
      } catch {
        // audio policy fallback
      }
    }
  }, [isSimulating, validation.activeOutputs.buzzers]);

  // Oscilloscope animation tick
  useEffect(() => {
    if (activeTab !== 'instruments' || !isSimulating) return;
    const interval = setInterval(() => {
      setScopeTraceTime((t) => (t + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, [activeTab, isSimulating]);

  const handleAddComponent = (catItem: typeof COMPONENT_CATALOG[0]) => {
    const defaultPin =
      boardDef.family === 'esp32' && catItem.type === 'potentiometer'
        ? '34'
        : boardDef.family === 'raspberry_pi_pico'
        ? (catItem.type === 'potentiometer' ? 'GP26' : catItem.type === 'led' ? 'GP25' : 'GP14')
        : boardDef.family === 'raspberry_pi'
        ? (catItem.type === 'potentiometer' ? 'GPIO4' : catItem.type === 'led' ? 'GPIO17' : 'GPIO27')
        : catItem.defaultPin;

    const newId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const newComp: SimulatedComponent = {
      id: newId,
      type: catItem.type,
      label: catItem.label.split('(')[0].trim(),
      color: catItem.label.includes('Green') ? 'green' : catItem.label.includes('Blue') ? 'blue' : 'red',
      state: {
        pin: defaultPin,
        value: catItem.type === 'potentiometer' ? 512 : catItem.type === 'ultrasonic_sensor' ? 25 : false,
        digitalValue: true,
        analogValue: 512,
        angle: 90,
        temperature: 24,
        humidity: 50,
        distance: 25,
        text: 'InnoLink Lab',
      },
      pins: { signal: defaultPin, vcc: '5V', gnd: 'GND' },
    };

    onUpdateComponents([...components, newComp]);
    setSelectedCompId(newId);
  };

  const handleRemoveComponent = (id: string) => {
    onUpdateComponents(components.filter((c) => c.id !== id));
    if (selectedCompId === id) setSelectedCompId(null);
  };

  const handleDuplicateComponent = (comp: SimulatedComponent) => {
    const newComp: SimulatedComponent = {
      ...comp,
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      label: `${comp.label} (Copy)`,
      state: { ...comp.state },
      pins: { ...comp.pins },
    };
    onUpdateComponents([...components, newComp]);
    setSelectedCompId(newComp.id);
  };

  const handleUpdateComponentParam = (id: string, partialState: Partial<SimulatedComponent['state']>) => {
    onUpdateComponents(
      components.map((c) =>
        c.id === id ? { ...c, state: { ...c.state, ...partialState } } : c
      )
    );
  };

  const handleSendSerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    onSendSerialInput(serialInput.trim());
    setSerialInput('');
  };

  const filteredCatalog = COMPONENT_CATALOG.filter((item) => {
    if (libraryCategory !== 'all') {
      if (libraryCategory === 'boards' && item.category !== 'Boards') return false;
      if (libraryCategory === 'prototyping' && item.category !== 'Prototyping') return false;
      if (libraryCategory === 'basic' && item.category !== 'Basic') return false;
      if (libraryCategory === 'sensors' && item.category !== 'Sensors') return false;
      if (libraryCategory === 'outputs' && item.category !== 'Outputs') return false;
      if (libraryCategory === 'test' && item.category !== 'Test Equipment') return false;
    }
    if (librarySearch.trim()) {
      const q = librarySearch.toLowerCase();
      return item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    }
    return true;
  });

  const errorCount = validation.diagnostics.filter((d) => d.type === 'error').length;
  const warningCount = validation.diagnostics.filter((d) => d.type === 'warning').length;

  return (
    <div className={`flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-xl overflow-hidden ${className}`}>
      {/* ========================================================= */}
      {/* 1. TOP ENGINEERING TOOLBAR: Board Selector, Tools & Views */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-200 select-none">
        {/* Left: Searchable Board Selector & Framework Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {onChangeBoard ? (
            <SearchableBoardSelector
              selectedBoard={board as HardwareBoard}
              onChangeBoard={onChangeBoard}
            />
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-semibold text-white">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{boardDef.name}</span>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
            <span className="text-cyan-400">{boardDef.mcu}</span>
            <span>•</span>
            <span className="text-amber-400">{boardDef.clockSpeed}</span>
            <span>•</span>
            <span className="text-emerald-400">{boardDef.operatingVoltage}</span>
          </div>
        </div>

        {/* Center: Engineering View Switcher */}
        <div className="flex items-center p-0.5 rounded-lg border border-slate-800 bg-slate-950 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('workbench')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workbench'
                ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tinkercad-Style Studio Layout (Library + Canvas + Inspector)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('breadboard')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'breadboard'
                ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Full Width Breadboard Canvas"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'components'
                ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Component Library Catalog"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Components</span>
            <span className="text-[10px] opacity-70">({components.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instruments')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'instruments'
                ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Virtual Digital Multimeter & Oscilloscope"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instruments</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Electrical Rules Check & Diagnostics"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Diagnostics</span>
            {errorCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                {errorCount}
              </span>
            ) : warningCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                {warningCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('serial')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'serial'
                ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Serial Console Monitor"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Serial</span>
          </button>
        </div>

        {/* Right: Simulation Run/Stop Actions */}
        <div className="flex items-center gap-2">
          {!isSimulating ? (
            <button
              type="button"
              onClick={onToggleSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
              title="Start virtual circuit simulation and firmware execution"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Circuit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer shadow-xs animate-pulse"
              title="Halt circuit simulation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Simulation</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetSimulation}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE VIEWPORTS */}
      {/* ========================================================= */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-950">
        {/* VIEW 1: TINKERCAD-STYLE STUDIO WORKBENCH (3-Column Layout) */}
        {activeTab === 'workbench' && (
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* LEFT COLUMN: Component Library Drawer (Collapsible) */}
            <div
              className={`${
                isLibraryOpen ? 'w-64 xl:w-72' : 'w-10'
              } border-r border-slate-800 bg-slate-900/90 flex flex-col transition-all duration-200 shrink-0 select-none overflow-hidden`}
            >
              {/* Drawer Header */}
              <div className="p-2 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200">
                {isLibraryOpen && (
                  <span className="flex items-center gap-1.5 text-[11px] truncate">
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Component Library</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer ml-auto"
                  title={isLibraryOpen ? 'Collapse library panel' : 'Expand component library'}
                >
                  {isLibraryOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {isLibraryOpen && (
                <div className="flex-1 min-h-0 flex flex-col p-2 space-y-2 overflow-hidden">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      placeholder="Search parts (LED, sensor)..."
                      className="w-full pl-7 pr-6 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    {librarySearch && (
                      <button
                        type="button"
                        onClick={() => setLibrarySearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'basic', label: 'Basic' },
                      { id: 'sensors', label: 'Sensors' },
                      { id: 'outputs', label: 'Outputs' },
                      { id: 'boards', label: 'Boards' },
                      { id: 'prototyping', label: 'Prototyping' },
                      { id: 'test', label: 'Test' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setLibraryCategory(c.id)}
                        className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition cursor-pointer border ${
                          libraryCategory === c.id
                            ? 'border-cyan-500 bg-cyan-950 text-cyan-200'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 overscroll-contain pr-1">
                    {filteredCatalog.map((catItem, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-950 hover:border-slate-700 transition flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="font-semibold text-slate-200 block truncate text-[11px]">
                            {catItem.label}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate font-mono">
                            {catItem.desc}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddComponent(catItem)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white font-medium text-[10px] transition cursor-pointer shrink-0 flex items-center gap-1"
                          title={`Mount ${catItem.label} to circuit`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CENTER COLUMN: Interactive Breadboard Canvas Workspace */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
              {/* Starter Circuit Quick Selector Bar */}
              <div className="p-2 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Starter Circuits:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {STARTER_CIRCUITS.map((starter) => (
                    <button
                      key={starter.id}
                      type="button"
                      onClick={() => {
                        onUpdateComponents(starter.components);
                        handleUpdateWires(starter.wires);
                        if (onLoadStarterCircuit) onLoadStarterCircuit(starter);
                      }}
                      className="px-2 py-0.5 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-medium transition cursor-pointer"
                      title={`Load ${starter.title}`}
                    >
                      {starter.title.split('.')[1] || starter.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* The Core Interactive Breadboard Canvas */}
              <div className="flex-1 min-h-0 overflow-hidden relative">
                <InteractiveBreadboardCanvas
                  board={board}
                  components={components}
                  wires={currentWires}
                  onUpdateComponents={onUpdateComponents}
                  onUpdateWires={handleUpdateWires}
                  isSimulating={isSimulating}
                  onToggleSimulation={onToggleSimulation}
                  validation={validation}
                  selectedComponentId={selectedCompId}
                  onSelectComponent={setSelectedCompId}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Component Inspector / Properties Panel (Collapsible) */}
            <div
              className={`${
                isInspectorOpen ? 'w-64 xl:w-72' : 'w-10'
              } border-l border-slate-800 bg-slate-900/90 flex flex-col transition-all duration-200 shrink-0 select-none overflow-hidden`}
            >
              {/* Inspector Header */}
              <div className="p-2 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200">
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer mr-auto"
                  title={isInspectorOpen ? 'Collapse inspector panel' : 'Expand component inspector'}
                >
                  {isInspectorOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
                {isInspectorOpen && (
                  <span className="flex items-center gap-1.5 text-[11px] truncate">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Component Inspector</span>
                  </span>
                )}
              </div>

              {isInspectorOpen && (
                <div className="flex-1 overflow-y-auto p-2.5 space-y-3 overscroll-contain text-xs">
                  {selectedComponent ? (
                    <div className="space-y-3">
                      {/* Component Title & Quick Actions */}
                      <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">
                            {selectedComponent.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateComponent(selectedComponent)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                              title="Duplicate component"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(selectedComponent.id)}
                              className="p-1 rounded hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 cursor-pointer"
                              title="Delete component"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Editable Label */}
                        <input
                          type="text"
                          value={selectedComponent.label}
                          onChange={(e) => {
                            const newLbl = e.target.value;
                            onUpdateComponents(
                              components.map((c) => (c.id === selectedComponent.id ? { ...c, label: newLbl } : c))
                            );
                          }}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      {/* Component-Specific Electrical Controls */}
                      {selectedComponent.type === 'led' && (
                        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 space-y-2.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">LED Properties</span>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">LED Color:</span>
                            <div className="flex items-center gap-1.5">
                              {['red', 'green', 'blue', 'yellow'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() =>
                                    onUpdateComponents(
                                      components.map((x) => (x.id === selectedComponent.id ? { ...x, color: c } : x))
                                    )
                                  }
                                  className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                                    selectedComponent.color === c ? 'ring-2 ring-white scale-110' : 'opacity-60'
                                  }`}
                                  style={{ backgroundColor: c === 'yellow' ? '#eab308' : c }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Forward Drop:</span>
                            <span className="font-mono text-emerald-400">2.0 V / 20 mA</span>
                          </div>
                        </div>
                      )}

                      {selectedComponent.type === 'servo' && (
                        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Shaft Angle:</span>
                            <span className="font-mono font-bold text-cyan-400">
                              {selectedComponent.state?.angle ?? 90}°
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={180}
                            value={selectedComponent.state?.angle ?? 90}
                            onChange={(e) =>
                              handleUpdateComponentParam(selectedComponent.id, { angle: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      )}

                      {selectedComponent.type === 'potentiometer' && (
                        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Wiper Position:</span>
                            <span className="font-mono font-bold text-amber-400">
                              {selectedComponent.state?.analogValue ?? 512} / 1023
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1023}
                            value={selectedComponent.state?.analogValue ?? 512}
                            onChange={(e) =>
                              handleUpdateComponentParam(selectedComponent.id, { analogValue: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      )}

                      {selectedComponent.type === 'ultrasonic_sensor' && (
                        <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Obstacle Distance:</span>
                            <span className="font-mono font-bold text-cyan-400">
                              {selectedComponent.state?.distance ?? 25} cm
                            </span>
                          </div>
                          <input
                            type="range"
                            min={2}
                            max={300}
                            value={selectedComponent.state?.distance ?? 25}
                            onChange={(e) =>
                              handleUpdateComponentParam(selectedComponent.id, { distance: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Pin Mapping Selector */}
                      <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Pin Routing</span>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Connected Pin:</span>
                          <select
                            value={selectedComponent.state?.pin || selectedComponent.pins?.signal || '2'}
                            onChange={(e) =>
                              handleUpdateComponentParam(selectedComponent.id, { pin: e.target.value })
                            }
                            className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-mono text-white focus:outline-none cursor-pointer"
                          >
                            {boardDef.availablePins
                              .filter((p) => p.type !== 'ground')
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.voltage})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Default: Circuit Overview & Prototyping Checklist */
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono block">
                          Circuit Health Overview
                        </span>
                        <div className="space-y-1.5 text-[11px] text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Mounted Components:</span>
                            <span className="font-mono font-semibold text-white">{components.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Jumper Wires:</span>
                            <span className="font-mono font-semibold text-emerald-400">{currentWires.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Electrical Nets:</span>
                            <span className="font-mono font-semibold text-cyan-400">
                              {Object.keys(validation.connectedNets).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Estimated Current:</span>
                            <span className="font-mono font-semibold text-amber-400">
                              ~{components.length * 15 + 10} mA
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1.5">
                        <span className="font-semibold text-slate-200 block text-xs">Workbench Tips:</span>
                        <p>• Click any breadboard hole or board pin to start a jumper wire.</p>
                        <p>• Click any component to open its electrical parameters here.</p>
                        <p>• Always connect a 220Ω resistor in series with LEDs to protect the MCU.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: FULL WIDTH BREADBOARD CANVAS ONLY */}
        {activeTab === 'breadboard' && (
          <div className="flex-1 min-h-[460px] p-3 flex flex-col">
            <InteractiveBreadboardCanvas
              board={board}
              components={components}
              wires={currentWires}
              onUpdateComponents={onUpdateComponents}
              onUpdateWires={handleUpdateWires}
              isSimulating={isSimulating}
              onToggleSimulation={onToggleSimulation}
              validation={validation}
              selectedComponentId={selectedCompId}
              onSelectComponent={setSelectedCompId}
            />
          </div>
        )}

        {/* VIEW 3: COMPONENT CATALOG FULL GRID */}
        {activeTab === 'components' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Comprehensive Virtual Electronics Component Library
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any electronic part to mount it to your virtual workbench.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {COMPONENT_CATALOG.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs flex items-center justify-between group hover:border-cyan-500 transition shadow-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="block font-semibold text-white truncate">{cat.label}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{cat.category}</span>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{cat.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddComponent(cat);
                      setActiveTab('workbench');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: VIRTUAL TEST INSTRUMENTS (Multimeter & Oscilloscope) */}
        {activeTab === 'instruments' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4 max-w-4xl">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Virtual Test Bench Instruments
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Interactive Digital Multimeter and Dual-Trace Oscilloscope for live circuit measurement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instrument 1: Digital Multimeter (DMM) */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-3 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4" />
                    <span>InnoLink DMM-800 Digital Multimeter</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">CAT III 600V</span>
                </div>

                {/* DMM 7-Segment Screen */}
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-2xl font-bold text-emerald-400 tracking-wider">
                    {isSimulating
                      ? meterMode === 'volts'
                        ? '5.00'
                        : meterMode === 'amps'
                        ? '18.4'
                        : '220.0'
                      : '0.00'}
                  </span>
                  <span className="text-lg font-bold text-emerald-500">
                    {meterMode === 'volts' ? 'V DC' : meterMode === 'amps' ? 'mA DC' : 'Ω'}
                  </span>
                </div>

                {/* Range Rotary Switch */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {(['volts', 'amps', 'ohms'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMeterMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition cursor-pointer border ${
                        meterMode === m
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instrument 2: Virtual Digital Oscilloscope */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-3 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    <span>InnoLink DSO-200 2-Channel Scope</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">100 MSa/s</span>
                </div>

                {/* Scope Phosphor Screen */}
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 h-28 relative overflow-hidden flex items-center">
                  <svg className="w-full h-full" viewBox="0 0 300 80">
                    {/* Grid */}
                    <path
                      d="M 0 20 H 300 M 0 40 H 300 M 0 60 H 300 M 60 0 V 80 M 120 0 V 80 M 180 0 V 80 M 240 0 V 80"
                      stroke="#1e293b"
                      strokeWidth="0.8"
                    />
                    {/* Live Sine Trace */}
                    <path
                      d={`M 0 ${
                        isSimulating
                          ? 40 + Math.sin(scopeTraceTime * 0.1) * 25
                          : 40
                      } ${Array.from({ length: 30 }, (_, i) => {
                        const x = i * 10;
                        const y = isSimulating ? 40 + Math.sin((i + scopeTraceTime * 0.2) * 0.7) * 25 : 40;
                        return `L ${x} ${y}`;
                      }).join(' ')}`}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>CH1: 1.0V / DIV</span>
                  <span>TIME: 500μs / DIV</span>
                  <span className="text-cyan-400">FREQ: 1.0 kHz</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: DIAGNOSTICS & SIMULATION ERRORS */}
        {activeTab === 'diagnostics' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-3 max-w-2xl">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Circuit Diagnostics & Rules Engine
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time electrical verification and hardware compatibility checks.
              </p>
            </div>

            {validation.diagnostics.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All electrical rules pass. Circuit is healthy and ready for firmware execution.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {validation.diagnostics.map((diag, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      diag.type === 'error'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                        : diag.type === 'warning'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {diag.type === 'error' ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      ) : diag.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 shrink-0" />
                      )}
                      <span>{diag.message}</span>
                    </div>
                    {diag.suggestion && (
                      <p className="text-[11px] opacity-90 pl-6">
                        <strong>Recommendation:</strong> {diag.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: SERIAL MONITOR */}
        {activeTab === 'serial' && (
          <div className="p-4 flex-1 overflow-hidden space-y-3 flex flex-col h-[340px]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Serial Terminal</span>
                <span className="font-mono text-[10px] text-slate-400">
                  Baud: {boardDef.defaultBaudRate} | 8-N-1
                </span>
              </div>
              <button
                type="button"
                onClick={onClearSerial}
                className="text-[11px] text-slate-400 hover:text-white hover:underline cursor-pointer"
              >
                Clear Terminal
              </button>
            </div>

            <div
              ref={serialContainerRef}
              onScroll={handleSerialScroll}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-[11px] text-slate-200 overflow-y-auto space-y-1 overscroll-contain select-text"
            >
              {serialLogs.length === 0 ? (
                <span className="text-slate-500">
                  [Serial Monitor Ready] Run circuit firmware to stream output messages.
                </span>
              ) : (
                serialLogs.map((log, idx) => <div key={idx}>{log}</div>)
              )}
            </div>

            <form onSubmit={handleSendSerial} className="flex gap-2">
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Send serial input command (e.g. 1, 0, STATUS)..."
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* VIEW 7: PINOUT MAP */}
        {activeTab === 'pinout' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-3 max-w-3xl">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {boardDef.name} Pinout & Capabilities
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Official hardware peripheral pin definitions for {boardDef.mcu}.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-semibold">
                    <th className="p-2.5">Pin ID</th>
                    <th className="p-2.5">Label</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Voltage</th>
                    <th className="p-2.5">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px] text-slate-300">
                  {boardDef.availablePins.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/60">
                      <td className="p-2.5 font-bold text-white">{p.id}</td>
                      <td className="p-2.5">{p.name}</td>
                      <td className="p-2.5 uppercase text-[10px] text-cyan-400">{p.type}</td>
                      <td className="p-2.5 text-emerald-400">{p.voltage}</td>
                      <td className="p-2.5 text-slate-400 font-sans">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
