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
} from 'lucide-react';
import { HardwareBoard, SimulatedComponent } from '../../types';
import { BOARD_REGISTRY } from '../../lib/boardRegistry';
import { validateAndSimulateCircuit, SimulationDiagnostic } from '../../lib/circuitEngine';

interface VirtualHardwareWorkspaceProps {
  board: HardwareBoard | string;
  onChangeBoard?: (newBoard: HardwareBoard) => void;
  components: SimulatedComponent[];
  onUpdateComponents: (comps: SimulatedComponent[]) => void;
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
  { type: 'led' as const, label: '5mm LED (Red / Green / Blue)', category: 'Outputs', defaultPin: '2' },
  { type: 'rgb_led' as const, label: 'RGB LED (Common Cathode)', category: 'Outputs', defaultPin: '3' },
  { type: 'resistor' as const, label: '220Ω Current Limiting Resistor', category: 'Passives', defaultPin: '2' },
  { type: 'push_button' as const, label: 'Tactile Push Button', category: 'Inputs', defaultPin: '4' },
  { type: 'potentiometer' as const, label: '10kΩ Rotary Potentiometer', category: 'Inputs', defaultPin: 'A0' },
  { type: 'buzzer' as const, label: 'Piezo Buzzer (5V / PWM)', category: 'Outputs', defaultPin: '8' },
  { type: 'servo' as const, label: 'SG90 Micro Servo (0-180°)', category: 'Outputs', defaultPin: '9' },
  { type: 'ultrasonic_sensor' as const, label: 'HC-SR04 Ultrasonic Sensor', category: 'Sensors', defaultPin: '9' },
  { type: 'dht_sensor' as const, label: 'DHT11 Temp & Humidity Sensor', category: 'Sensors', defaultPin: '5' },
  { type: 'lcd_16x2' as const, label: '16x2 Character LCD (I2C)', category: 'Displays', defaultPin: 'A4' },
];

export const VirtualHardwareWorkspace: React.FC<VirtualHardwareWorkspaceProps> = ({
  board,
  onChangeBoard,
  components,
  onUpdateComponents,
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
  const [activeTab, setActiveTab] = useState<'breadboard' | 'components' | 'diagnostics' | 'serial' | 'pinout'>('breadboard');
  const boardDef = BOARD_REGISTRY[board] || BOARD_REGISTRY.arduino_uno;
  const [serialInput, setSerialInput] = useState('');
  const serialEndRef = useRef<HTMLDivElement | null>(null);

  // Audio tone context for buzzer simulation
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Circuit diagnostics evaluation
  const validation = validateAndSimulateCircuit(board, components, isSimulating);

  useEffect(() => {
    serialEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleAddComponent = (catItem: typeof COMPONENT_CATALOG[0]) => {
    const defaultPin =
      boardDef.family === 'esp32' && catItem.type === 'potentiometer'
        ? '34'
        : boardDef.family === 'raspberry_pi' && catItem.type === 'potentiometer'
        ? 'GP26'
        : catItem.defaultPin;

    const newComp: SimulatedComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: catItem.type,
      label: catItem.label.split('(')[0].trim(),
      color: catItem.type === 'led' ? 'red' : undefined,
      state: {
        pin: defaultPin,
        value: catItem.type === 'potentiometer' ? 512 : catItem.type === 'ultrasonic_sensor' ? 25 : false,
        digitalValue: true,
        analogValue: 255,
        angle: 90,
        temperature: 24,
        humidity: 50,
        distance: 25,
        text: 'InnoLink Lab',
      },
      pins: { signal: defaultPin, vcc: '5V', gnd: 'GND' },
    };

    onUpdateComponents([...components, newComp]);
  };

  const handleRemoveComponent = (id: string) => {
    onUpdateComponents(components.filter((c) => c.id !== id));
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

  const errorCount = validation.diagnostics.filter((d) => d.type === 'error').length;
  const warningCount = validation.diagnostics.filter((d) => d.type === 'warning').length;

  return (
    <div className={`flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-xs overflow-hidden ${className}`}>
      {/* 1. Header Toolbar: Board Selector + Simulation Controls + View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--surface-secondary)] border-b border-[var(--border)] text-xs">
        {/* Left: Board Selector */}
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[var(--muted-text)]" />
          <span className="font-semibold text-[var(--foreground)] hidden sm:inline">Target Board:</span>
          <select
            value={board}
            onChange={(e) => onChangeBoard?.(e.target.value as HardwareBoard)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            <optgroup label="Arduino Microcontrollers">
              <option value="arduino_uno">Arduino Uno R3 (ATmega328P)</option>
              <option value="arduino_nano">Arduino Nano V3 (ATmega328P)</option>
              <option value="arduino_mega">Arduino Mega 2560 (ATmega2560)</option>
            </optgroup>
            <optgroup label="Espressif ESP32 Systems">
              <option value="esp32">ESP32 DevKit V1 (Xtensa LX6 / Wi-Fi)</option>
              <option value="esp32_c3">ESP32-C3 RISC-V DevKit</option>
            </optgroup>
            <optgroup label="Raspberry Pi Silicon">
              <option value="rp2040_pico">Raspberry Pi Pico (RP2040)</option>
              <option value="rp2040_pico_w">Raspberry Pi Pico W (Wi-Fi)</option>
            </optgroup>
          </select>
        </div>

        {/* Middle: Tab Switcher */}
        <div className="flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('breadboard')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'breadboard'
                ? 'bg-[var(--surface-secondary)] text-[var(--foreground)] font-semibold shadow-xs'
                : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Virtual Breadboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'components'
                ? 'bg-[var(--surface-secondary)] text-[var(--foreground)] font-semibold shadow-xs'
                : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Component Library ({components.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'bg-[var(--surface-secondary)] text-[var(--foreground)] font-semibold shadow-xs'
                : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Diagnostics</span>
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
                ? 'bg-[var(--surface-secondary)] text-[var(--foreground)] font-semibold shadow-xs'
                : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Serial Console</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pinout')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pinout'
                ? 'bg-[var(--surface-secondary)] text-[var(--foreground)] font-semibold shadow-xs'
                : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pinout</span>
          </button>
        </div>

        {/* Right: Simulation Run/Stop Actions */}
        <div className="flex items-center gap-2">
          {!isSimulating ? (
            <button
              type="button"
              onClick={onToggleSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Circuit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Simulation</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetSimulation}
            className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Tab View Area */}
      <div className="p-4 flex-1 overflow-auto min-h-[360px]">
        {/* TAB 1: INTERACTIVE BREADBOARD CANVAS */}
        {activeTab === 'breadboard' && (
          <div className="space-y-4">
            {/* Board Status Card */}
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold text-[10px]">
                  MCU
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)]">{boardDef.name}</h4>
                  <p className="text-[10px] text-[var(--muted-text)]">
                    MCU: {boardDef.mcu} • Operating Voltage: {boardDef.operatingVoltage} • Clock: {boardDef.clockSpeed}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-[var(--muted-text)]">Sim State:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      isSimulating
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-[var(--surface)] text-[var(--muted-text)] border border-[var(--border)]'
                    }`}
                  >
                    {isSimulating ? '● ACTIVE RUNNING' : '○ IDLE (STOPPED)'}
                  </span>
                </div>
                {recommendedKitId && onNavigateToMarketplaceKit && (
                  <button
                    onClick={() => onNavigateToMarketplaceKit(recommendedKitId)}
                    className="text-[11px] font-semibold text-emerald-500 hover:underline cursor-pointer"
                  >
                    View Matching STEM Kit →
                  </button>
                )}
              </div>
            </div>

            {/* Virtual Breadboard Grid & Component Modules */}
            {components.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-[var(--border)] rounded-xl space-y-2">
                <Zap className="w-8 h-8 mx-auto text-[var(--muted-text)] opacity-40" />
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Your Breadboard is Empty</h4>
                <p className="text-xs text-[var(--muted-text)] max-w-sm mx-auto">
                  Add components from the library to build your circuit (LEDs, resistors, buttons, sensors).
                </p>
                <button
                  onClick={() => setActiveTab('components')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold transition cursor-pointer"
                >
                  Open Component Library
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {components.map((comp) => {
                  const ledOutput = validation.activeOutputs.leds[comp.id];
                  const buzzerOutput = validation.activeOutputs.buzzers[comp.id];
                  const servoOutput = validation.activeOutputs.servos[comp.id];
                  const lcdOutput = validation.activeOutputs.lcds[comp.id];

                  return (
                    <div
                      key={comp.id}
                      className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-xs space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                        <div>
                          <strong className="text-[var(--foreground)] font-semibold">{comp.label}</strong>
                          <span className="block text-[10px] text-[var(--muted-text)] font-mono uppercase">
                            {comp.type}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveComponent(comp.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          title="Remove Component"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dynamic Component Visual Feedback & Controls */}
                      {comp.type === 'led' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[var(--muted-text)]">Hardware State:</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                                  isSimulating && ledOutput?.state
                                    ? comp.color === 'green'
                                      ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]'
                                      : comp.color === 'blue'
                                      ? 'bg-blue-500 shadow-[0_0_12px_#3b82f6]'
                                      : 'bg-rose-500 shadow-[0_0_12px_#ef4444]'
                                    : 'bg-[var(--surface)] border-[var(--border)] opacity-40'
                                }`}
                              />
                              <span className="text-[10px] font-mono font-bold">
                                {isSimulating && ledOutput?.state ? 'GLOWING (ON)' : 'OFF'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--muted-text)]">Color:</span>
                            <div className="flex gap-1">
                              {['red', 'green', 'blue'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => onUpdateComponents(components.map((x) => x.id === comp.id ? { ...x, color: c } : x))}
                                  className={`w-4 h-4 rounded-full border transition ${
                                    comp.color === c ? 'ring-2 ring-[var(--foreground)]' : 'opacity-60'
                                  }`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {comp.type === 'buzzer' && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[var(--muted-text)]">Audio Status:</span>
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSimulating && buzzerOutput?.active
                                ? 'bg-amber-500/20 text-amber-500 animate-pulse'
                                : 'bg-[var(--surface)] text-[var(--muted-text)]'
                            }`}
                          >
                            {isSimulating && buzzerOutput?.active ? 'BEEPING (1000Hz)' : 'SILENT'}
                          </span>
                        </div>
                      )}

                      {comp.type === 'servo' && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--muted-text)]">Shaft Angle:</span>
                            <span className="font-mono font-bold text-[var(--foreground)]">{comp.state?.angle || 90}°</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={180}
                            value={comp.state?.angle || 90}
                            onChange={(e) =>
                              handleUpdateComponentParam(comp.id, { angle: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-[var(--foreground)]"
                          />
                        </div>
                      )}

                      {comp.type === 'potentiometer' && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--muted-text)]">Wiper Resistance:</span>
                            <span className="font-mono font-bold text-[var(--foreground)]">
                              {comp.state?.analogValue || 512} / 1023
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1023}
                            value={comp.state?.analogValue || 512}
                            onChange={(e) =>
                              handleUpdateComponentParam(comp.id, { analogValue: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-[var(--foreground)]"
                          />
                        </div>
                      )}

                      {comp.type === 'ultrasonic_sensor' && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--muted-text)]">Simulated Obstacle:</span>
                            <span className="font-mono font-bold text-[var(--foreground)]">
                              {comp.state?.distance || 25} cm
                            </span>
                          </div>
                          <input
                            type="range"
                            min={2}
                            max={400}
                            value={comp.state?.distance || 25}
                            onChange={(e) =>
                              handleUpdateComponentParam(comp.id, { distance: parseInt(e.target.value, 10) })
                            }
                            className="w-full accent-[var(--foreground)]"
                          />
                        </div>
                      )}

                      {comp.type === 'lcd_16x2' && (
                        <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[11px] text-emerald-500 space-y-0.5">
                          <div>{lcdOutput?.line1 || comp.state?.text || 'Hello InnoLink'}</div>
                          <div className="opacity-70">{lcdOutput?.line2 || 'Circuit Ready'}</div>
                        </div>
                      )}

                      {/* Pin Assignment Selector */}
                      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--muted-text)]">Connected Pin:</span>
                        <select
                          value={comp.state?.pin || comp.pins?.signal || '2'}
                          onChange={(e) => handleUpdateComponentParam(comp.id, { pin: e.target.value })}
                          className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-mono text-[var(--foreground)]"
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPONENT CATALOG / LIBRARY */}
        {activeTab === 'components' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Hardware Component Library
              </h4>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Click any component below to mount it to your virtual circuit board.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMPONENT_CATALOG.map((cat) => (
                <div
                  key={cat.type}
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-xs flex items-center justify-between group hover:border-[var(--foreground)] transition shadow-xs"
                >
                  <div>
                    <span className="block font-semibold text-[var(--foreground)]">{cat.label}</span>
                    <span className="text-[10px] text-[var(--muted-text)] uppercase font-mono">{cat.category}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleAddComponent(cat);
                      setActiveTab('breadboard');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium text-xs flex items-center gap-1 hover:opacity-90 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DIAGNOSTICS & SIMULATION ERRORS */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-3 max-w-2xl">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Circuit Diagnostics & Rules Engine
              </h4>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Real-time electrical verification and hardware compatibility checks.
              </p>
            </div>

            {validation.diagnostics.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-2">
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
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                        : diag.type === 'warning'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                        : 'border-blue-500/30 bg-blue-500/10 text-blue-500'
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

        {/* TAB 4: SERIAL MONITOR */}
        {activeTab === 'serial' && (
          <div className="space-y-3 flex flex-col h-[340px]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--foreground)]">Serial Terminal</span>
                <span className="font-mono text-[10px] text-[var(--muted-text)]">
                  Baud: {boardDef.defaultBaudRate} | 8-N-1
                </span>
              </div>
              <button
                onClick={onClearSerial}
                className="text-[11px] text-[var(--muted-text)] hover:text-[var(--foreground)] hover:underline cursor-pointer"
              >
                Clear Terminal
              </button>
            </div>

            <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-3 font-mono text-[11px] text-[var(--foreground)] overflow-y-auto space-y-1">
              {serialLogs.length === 0 ? (
                <span className="text-[var(--muted-text)] opacity-60">
                  [Serial Monitor Ready] Run circuit firmware to stream output messages.
                </span>
              ) : (
                serialLogs.map((log, idx) => <div key={idx}>{log}</div>)
              )}
              <div ref={serialEndRef} />
            </div>

            <form onSubmit={handleSendSerial} className="flex gap-2">
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Send serial input command (e.g. 1, 0, STATUS)..."
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1.5 text-xs text-[var(--foreground)] font-mono focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: PINOUT MAP */}
        {activeTab === 'pinout' && (
          <div className="space-y-3 max-w-3xl">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                {boardDef.name} Pinout & Capabilities
              </h4>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Official hardware peripheral pin definitions for {boardDef.mcu}.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-text)] font-semibold">
                    <th className="p-2.5">Pin ID</th>
                    <th className="p-2.5">Label</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Voltage</th>
                    <th className="p-2.5">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono text-[11px]">
                  {boardDef.availablePins.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-secondary)]">
                      <td className="p-2.5 font-bold text-[var(--foreground)]">{p.id}</td>
                      <td className="p-2.5">{p.name}</td>
                      <td className="p-2.5 uppercase text-[10px]">{p.type}</td>
                      <td className="p-2.5">{p.voltage}</td>
                      <td className="p-2.5 text-[var(--muted-text)] font-sans">{p.description}</td>
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
