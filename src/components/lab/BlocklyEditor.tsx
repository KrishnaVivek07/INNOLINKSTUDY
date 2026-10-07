import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Cpu,
  Layers,
  Code,
  Zap,
  Radio,
  Sliders,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { HardwareBoard } from '../../types';
import { BOARD_REGISTRY } from '../../lib/boardRegistry';

export interface ElectronicsBlock {
  id: string;
  category: 'logic' | 'input' | 'output' | 'sensor' | 'communication' | 'variables';
  type: string;
  label: string;
  params: Record<string, any>;
}

interface BlocklyEditorProps {
  board: HardwareBoard | string;
  language?: 'arduino_c' | 'micropython' | 'blocks' | 'hybrid';
  blocks: ElectronicsBlock[];
  onChangeBlocks: (blocks: ElectronicsBlock[]) => void;
  onGenerateCode: (generatedCode: string) => void;
  className?: string;
}

export const AVAILABLE_BLOCK_TEMPLATES: {
  category: ElectronicsBlock['category'];
  type: string;
  label: string;
  defaultParams: Record<string, any>;
}[] = [
  // OUTPUTS & ACTUATORS
  {
    category: 'output',
    type: 'pin_mode',
    label: 'Configure Pin Mode (OUTPUT / INPUT)',
    defaultParams: { pin: '2', mode: 'OUTPUT' },
  },
  {
    category: 'output',
    type: 'digital_write',
    label: 'Set Digital Pin (HIGH / LOW)',
    defaultParams: { pin: '2', state: 'HIGH' },
  },
  {
    category: 'output',
    type: 'analog_write',
    label: 'Set PWM Duty Cycle / Brightness (0-255)',
    defaultParams: { pin: '3', value: 180 },
  },
  {
    category: 'output',
    type: 'servo_write',
    label: 'Rotate SG90 Servo to Angle (0-180°)',
    defaultParams: { pin: '9', angle: 90 },
  },
  {
    category: 'output',
    type: 'buzzer_tone',
    label: 'Play Buzzer Tone Frequency (Hz)',
    defaultParams: { pin: '8', frequency: 1000, duration: 500 },
  },

  // INPUTS & SENSORS
  {
    category: 'input',
    type: 'digital_read',
    label: 'Read Digital Pin (Button / Switch)',
    defaultParams: { pin: '4', varName: 'buttonState' },
  },
  {
    category: 'sensor',
    type: 'analog_read',
    label: 'Read Analog Voltage (Potentiometer / LDR)',
    defaultParams: { pin: 'A0', varName: 'sensorReading' },
  },
  {
    category: 'sensor',
    type: 'ultrasonic_read',
    label: 'Read HC-SR04 Distance (cm)',
    defaultParams: { trigPin: '9', echoPin: '10', varName: 'distanceCm' },
  },

  // TIMING & CONTROL
  {
    category: 'logic',
    type: 'wait',
    label: 'Wait Delay (Milliseconds)',
    defaultParams: { ms: 1000 },
  },
  {
    category: 'logic',
    type: 'if_condition',
    label: 'If Variable Comparison',
    defaultParams: { varName: 'distanceCm', operator: '<', value: 20 },
  },

  // COMMUNICATION
  {
    category: 'communication',
    type: 'serial_begin',
    label: 'Initialize Serial Monitor',
    defaultParams: { baud: 115200 },
  },
  {
    category: 'communication',
    type: 'serial_print',
    label: 'Print Message to Serial Monitor',
    defaultParams: { message: 'System active. Monitoring hardware...' },
  },
  {
    category: 'communication',
    type: 'serial_print_var',
    label: 'Print Variable Value to Serial',
    defaultParams: { varName: 'distanceCm' },
  },
];

export function compileBlocksToTargetCode(
  blocks: ElectronicsBlock[],
  boardId: string,
  targetLang: 'arduino_c' | 'micropython' = 'arduino_c'
): string {
  const board = BOARD_REGISTRY[boardId] || BOARD_REGISTRY.arduino_uno;
  const isPico = board.family === 'raspberry_pi';

  if (targetLang === 'micropython' && isPico) {
    // MicroPython compilation
    const lines: string[] = [
      '# Generated MicroPython Firmware',
      `# Target Hardware: ${board.name}`,
      'import machine',
      'import time',
      '',
      '# Hardware Pin Definitions',
    ];

    const pinsDefined = new Set<string>();
    blocks.forEach((b) => {
      if (b.params.pin && !pinsDefined.has(b.params.pin)) {
        pinsDefined.add(b.params.pin);
        const pinNum = b.params.pin.replace(/[^0-9]/g, '') || '25';
        lines.push(`pin_${pinNum} = machine.Pin(${pinNum}, machine.Pin.OUT)`);
      }
    });

    lines.push('', 'print("Firmware Initialized on ' + board.name + '")', 'while True:');

    if (blocks.length === 0) {
      lines.push('    time.sleep(1)');
      return lines.join('\n');
    }

    blocks.forEach((b) => {
      const pinNum = (b.params.pin || '25').replace(/[^0-9]/g, '') || '25';
      switch (b.type) {
        case 'digital_write':
          lines.push(`    pin_${pinNum}.value(${b.params.state === 'HIGH' ? '1' : '0'})`);
          break;
        case 'wait':
          lines.push(`    time.sleep_ms(${b.params.ms || 1000})`);
          break;
        case 'serial_print':
          lines.push(`    print("${b.params.message || ''}")`);
          break;
        case 'buzzer_tone':
          lines.push(`    # Buzzer frequency ${b.params.frequency || 1000}Hz on pin ${pinNum}`);
          break;
        default:
          break;
      }
    });

    return lines.join('\n');
  }

  // Arduino C/C++ compilation
  const baudRate = board.defaultBaudRate;
  const setupLines: string[] = [`  Serial.begin(${baudRate});`];
  const loopLines: string[] = [];

  const configuredPins = new Set<string>();

  blocks.forEach((b) => {
    switch (b.type) {
      case 'pin_mode':
        setupLines.push(`  pinMode(${b.params.pin}, ${b.params.mode});`);
        configuredPins.add(b.params.pin);
        break;
      case 'digital_write':
        if (!configuredPins.has(b.params.pin)) {
          setupLines.push(`  pinMode(${b.params.pin}, OUTPUT);`);
          configuredPins.add(b.params.pin);
        }
        loopLines.push(`  digitalWrite(${b.params.pin}, ${b.params.state});`);
        break;
      case 'analog_write':
        if (!configuredPins.has(b.params.pin)) {
          setupLines.push(`  pinMode(${b.params.pin}, OUTPUT);`);
          configuredPins.add(b.params.pin);
        }
        loopLines.push(`  analogWrite(${b.params.pin}, ${b.params.value});`);
        break;
      case 'buzzer_tone':
        loopLines.push(`  tone(${b.params.pin}, ${b.params.frequency}, ${b.params.duration});`);
        break;
      case 'servo_write':
        loopLines.push(`  // Servo on pin ${b.params.pin} -> angle: ${b.params.angle}°`);
        break;
      case 'digital_read':
        loopLines.push(`  int ${b.params.varName} = digitalRead(${b.params.pin});`);
        break;
      case 'analog_read':
        loopLines.push(`  int ${b.params.varName} = analogRead(${b.params.pin});`);
        break;
      case 'ultrasonic_read':
        loopLines.push(`  // HC-SR04: Trig=${b.params.trigPin}, Echo=${b.params.echoPin}`);
        loopLines.push(`  long duration = pulseIn(${b.params.echoPin}, HIGH);`);
        loopLines.push(`  float ${b.params.varName} = (duration * 0.0343) / 2.0;`);
        break;
      case 'wait':
        loopLines.push(`  delay(${b.params.ms});`);
        break;
      case 'serial_begin':
        // Handled in setup
        break;
      case 'serial_print':
        loopLines.push(`  Serial.println("${b.params.message}");`);
        break;
      case 'serial_print_var':
        loopLines.push(`  Serial.print("${b.params.varName} = ");`);
        loopLines.push(`  Serial.println(${b.params.varName});`);
        break;
      case 'if_condition':
        loopLines.push(`  if (${b.params.varName} ${b.params.operator} ${b.params.value}) {`);
        loopLines.push(`    Serial.println("Condition triggered!");`);
        loopLines.push(`  }`);
        break;
      default:
        break;
    }
  });

  return [
    `// ===================================================`,
    `// Autogenerated Code for ${board.name}`,
    `// Architecture: ${board.mcu} (${board.clockSpeed})`,
    `// ===================================================`,
    ``,
    `void setup() {`,
    setupLines.join('\n'),
    `}`,
    ``,
    `void loop() {`,
    loopLines.length > 0 ? loopLines.join('\n') : `  // Add visual blocks to program the hardware loop\n  delay(100);`,
    `}`,
  ].join('\n');
}

export const compileBlocksToArduinoCode = (
  blocks: ElectronicsBlock[],
  boardId: string
): string => compileBlocksToTargetCode(blocks, boardId, 'arduino_c');

export const BlocklyEditor: React.FC<BlocklyEditorProps> = ({
  board,
  language = 'arduino_c',
  blocks,
  onChangeBlocks,
  onGenerateCode,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState(false);

  const boardDef = BOARD_REGISTRY[board] || BOARD_REGISTRY.arduino_uno;
  const isPico = boardDef.family === 'raspberry_pi';
  const targetLang = isPico && language === 'micropython' ? 'micropython' : 'arduino_c';

  // Automatically update generated code whenever blocks change
  useEffect(() => {
    const code = compileBlocksToTargetCode(blocks, board, targetLang);
    onGenerateCode(code);
  }, [blocks, board, targetLang, onGenerateCode]);

  const handleAddBlock = (template: typeof AVAILABLE_BLOCK_TEMPLATES[0]) => {
    const newBlock: ElectronicsBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      category: template.category,
      type: template.type,
      label: template.label,
      params: { ...template.defaultParams },
    };
    onChangeBlocks([...blocks, newBlock]);
  };

  const handleRemoveBlock = (id: string) => {
    onChangeBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);
    onChangeBlocks(newBlocks);
  };

  const handleUpdateParam = (id: string, paramKey: string, value: any) => {
    onChangeBlocks(
      blocks.map((b) =>
        b.id === id ? { ...b, params: { ...b.params, [paramKey]: value } } : b
      )
    );
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? AVAILABLE_BLOCK_TEMPLATES
      : AVAILABLE_BLOCK_TEMPLATES.filter((t) => t.category === selectedCategory);

  const generatedCode = compileBlocksToTargetCode(blocks, board, targetLang);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className={`flex flex-col lg:flex-row gap-4 h-full ${className}`}>
      {/* 1. Left Column: Block Library */}
      <div className="w-full lg:w-72 flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
            Block Toolbox
          </span>
          <span className="text-[10px] text-[var(--muted-text)] font-mono">{filteredTemplates.length} blocks</span>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1 mb-2.5 pb-2 border-b border-[var(--border)] text-[10px]">
          {['all', 'output', 'input', 'sensor', 'logic', 'communication'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded capitalize transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-text)] hover:text-[var(--foreground)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[360px] lg:max-h-[500px]">
          {filteredTemplates.map((t) => (
            <button
              key={t.type}
              onClick={() => handleAddBlock(t)}
              className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] hover:border-[var(--foreground)] hover:bg-[var(--surface)] text-left transition flex items-center justify-between group cursor-pointer"
            >
              <div className="min-w-0 pr-2">
                <span className="block text-[11px] font-semibold text-[var(--foreground)] leading-tight truncate">
                  {t.label}
                </span>
                <span className="text-[9px] font-mono text-[var(--muted-text)] uppercase">{t.category}</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-[var(--muted-text)] group-hover:text-[var(--foreground)] shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 2. Middle Column: Active Program Flowchart / Block Sequence */}
      <div className="flex-1 flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs min-h-[300px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Visual Program Flow
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[var(--surface-secondary)] text-[var(--foreground)] font-mono border border-[var(--border)]">
              {blocks.length} Steps
            </span>
          </div>
          <button
            onClick={() => onChangeBlocks([])}
            className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Blocks</span>
          </button>
        </div>

        {blocks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--muted-text)] border border-dashed border-[var(--border)] rounded-lg">
            <Layers className="w-8 h-8 opacity-40 mb-2" />
            <p className="text-xs font-semibold text-[var(--foreground)]">No blocks in workspace</p>
            <p className="text-[11px] mt-0.5 max-w-xs">
              Click any block in the left toolbox to add commands to your microcontroller execution loop.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px] lg:max-h-[500px]">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-xs shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-mono font-bold text-[10px] text-[var(--foreground)]">
                      {index + 1}
                    </span>
                    <strong className="text-[var(--foreground)] text-[11px]">{block.label}</strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveBlock(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-[var(--surface)] disabled:opacity-30 cursor-pointer"
                      title="Move Step Up"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveBlock(index, 'down')}
                      disabled={index === blocks.length - 1}
                      className="p-1 rounded hover:bg-[var(--surface)] disabled:opacity-30 cursor-pointer"
                      title="Move Step Down"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveBlock(block.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      title="Remove Step"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Inline Parameter Editors */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border)] text-[11px]">
                  {/* Pin Selector if block uses pin */}
                  {block.params.pin !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--muted-text)]">Pin:</span>
                      <select
                        value={block.params.pin}
                        onChange={(e) => handleUpdateParam(block.id, 'pin', e.target.value)}
                        className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--foreground)] focus:outline-none"
                      >
                        {boardDef.availablePins
                          .filter((p) => p.type !== 'ground')
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* State selector */}
                  {block.params.state !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--muted-text)]">State:</span>
                      <select
                        value={block.params.state}
                        onChange={(e) => handleUpdateParam(block.id, 'state', e.target.value)}
                        className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--foreground)] focus:outline-none"
                      >
                        <option value="HIGH">HIGH (1)</option>
                        <option value="LOW">LOW (0)</option>
                      </select>
                    </div>
                  )}

                  {/* Delay ms */}
                  {block.params.ms !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--muted-text)]">Duration:</span>
                      <input
                        type="number"
                        min={10}
                        step={50}
                        value={block.params.ms}
                        onChange={(e) => handleUpdateParam(block.id, 'ms', parseInt(e.target.value, 10) || 100)}
                        className="w-16 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-text)]">ms</span>
                    </div>
                  )}

                  {/* Text Message */}
                  {block.params.message !== undefined && (
                    <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                      <span className="text-[var(--muted-text)]">Msg:</span>
                      <input
                        type="text"
                        value={block.params.message}
                        onChange={(e) => handleUpdateParam(block.id, 'message', e.target.value)}
                        className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--foreground)]"
                      />
                    </div>
                  )}

                  {/* Servo Angle */}
                  {block.params.angle !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--muted-text)]">Angle:</span>
                      <input
                        type="number"
                        min={0}
                        max={180}
                        value={block.params.angle}
                        onChange={(e) => handleUpdateParam(block.id, 'angle', parseInt(e.target.value, 10) || 0)}
                        className="w-14 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-text)]">deg</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Right Column: Generated Board Firmware Code View */}
      <div className="w-full lg:w-80 flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] block">
              Generated Firmware
            </span>
            <span className="text-[10px] text-[var(--muted-text)] font-mono">
              {targetLang === 'micropython' ? 'MicroPython (.py)' : 'Arduino C++ (.ino)'}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface)] text-[10px] text-[var(--foreground)] font-medium flex items-center gap-1 transition cursor-pointer"
          >
            {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-2.5 font-mono text-[11px] text-[var(--foreground)] leading-relaxed max-h-[360px] lg:max-h-[500px]">
          <pre className="whitespace-pre-wrap">{generatedCode}</pre>
        </div>
      </div>
    </div>
  );
};
