import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Trash2,
  RotateCcw,
  Plus,
  Play,
  Square,
  Sparkles,
  Info,
  Sliders,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HelpCircle,
  X,
  Volume2,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { HardwareBoard, SimulatedComponent, CircuitWire, WireEndpoint } from '../../types';
import { BOARD_REGISTRY } from '../../lib/boardRegistry';
import { getBreadboardInternalNet, CircuitValidationResult } from '../../lib/circuitEngine';

export interface InteractiveBreadboardCanvasProps {
  board: HardwareBoard | string;
  components: SimulatedComponent[];
  wires: CircuitWire[];
  onUpdateComponents: (comps: SimulatedComponent[]) => void;
  onUpdateWires: (wires: CircuitWire[]) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  validation: CircuitValidationResult;
  selectedComponentId?: string | null;
  onSelectComponent?: (id: string | null) => void;
}

export type WireColor = 'red' | 'black' | 'blue' | 'green' | 'yellow' | 'orange' | 'white';

const WIRE_COLORS: Record<WireColor, { name: string; hex: string; desc: string }> = {
  red: { name: 'Red', hex: '#ef4444', desc: 'Positive Power (+5V / +3.3V / VCC)' },
  black: { name: 'Black', hex: '#0f172a', desc: 'System Ground (GND / 0V)' },
  blue: { name: 'Blue', hex: '#3b82f6', desc: 'Digital Signal / Pulse' },
  green: { name: 'Green', hex: '#10b981', desc: 'Digital Output / Clock' },
  yellow: { name: 'Yellow', hex: '#eab308', desc: 'Analog Signal / Sensors' },
  orange: { name: 'Orange', hex: '#f97316', desc: 'PWM / Servo Control' },
  white: { name: 'White', hex: '#f8fafc', desc: 'I2C / SPI Communication' },
};

export const InteractiveBreadboardCanvas: React.FC<InteractiveBreadboardCanvasProps> = ({
  board,
  components,
  wires,
  onUpdateComponents,
  onUpdateWires,
  isSimulating,
  onToggleSimulation,
  validation,
  selectedComponentId,
  onSelectComponent,
}) => {
  const boardDef = BOARD_REGISTRY[board] || BOARD_REGISTRY.arduino_uno;

  // Active wire drawing state
  const [activeWireColor, setActiveWireColor] = useState<WireColor>('red');
  const [wireStart, setWireStart] = useState<WireEndpoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [hoveredNet, setHoveredNet] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(1.6, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.7, +(prev - 0.15).toFixed(2)));
  const handleResetZoom = () => setZoom(1.0);

  // Clear wire start on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWireStart(null);
        setSelectedWireId(null);
        setStatusMessage(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWireId) {
          onUpdateWires(wires.filter((w) => w.id !== selectedWireId));
          setSelectedWireId(null);
          setStatusMessage('Wire removed from circuit.');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWireId, wires, onUpdateWires]);

  // Handle canvas mouse move for interactive wire stretching
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!wireStart || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  // Click on a wire endpoint (Board Pin, Breadboard Hole, or Component Pin)
  const handleEndpointClick = (endpoint: WireEndpoint) => {
    if (!wireStart) {
      // Start drawing a wire
      setWireStart(endpoint);
      setStatusMessage(`Started ${activeWireColor} wire from ${endpoint.label || endpoint.pinId}. Click target pin or breadboard hole to connect.`);
    } else {
      // Don't connect an endpoint to itself
      if (
        wireStart.type === endpoint.type &&
        wireStart.componentId === endpoint.componentId &&
        wireStart.pinId === endpoint.pinId
      ) {
        setWireStart(null);
        setStatusMessage(null);
        return;
      }

      // Complete the wire
      const newWire: CircuitWire = {
        id: `wire-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        from: wireStart,
        to: endpoint,
        color: activeWireColor,
      };

      onUpdateWires([...wires, newWire]);
      setWireStart(null);
      setMousePos(null);
      setStatusMessage(`Connected wire from ${wireStart.label || wireStart.pinId} to ${endpoint.label || endpoint.pinId}!`);
    }
  };

  const handleDeleteWire = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onUpdateWires(wires.filter((w) => w.id !== id));
    if (selectedWireId === id) setSelectedWireId(null);
    setStatusMessage('Wire deleted.');
  };

  const handleClearAllWires = () => {
    onUpdateWires([]);
    setSelectedWireId(null);
    setWireStart(null);
    setStatusMessage('All jumper wires cleared.');
  };

  // Helper for component parameter changes
  const updateComponentState = (id: string, statePatch: Record<string, any>) => {
    onUpdateComponents(
      components.map((c) => (c.id === id ? { ...c, state: { ...c.state, ...statePatch } } : c))
    );
  };

  // Calculate endpoint coordinates on the SVG canvas
  const getEndpointCoords = (ep: WireEndpoint): { x: number; y: number } => {
    if (ep.x !== undefined && ep.y !== undefined) {
      return { x: ep.x, y: ep.y };
    }

    // Default coordinate lookups
    if (ep.type === 'board') {
      const pinIndex = boardDef.availablePins.findIndex((p) => p.id === ep.pinId);
      if (pinIndex !== -1) {
        if (pinIndex < 14) {
          return { x: 80 + pinIndex * 18, y: 70 };
        } else {
          return { x: 80 + (pinIndex - 14) * 20, y: 190 };
        }
      }
      return { x: 150, y: 130 };
    }

    if (ep.type === 'breadboard') {
      // Resolve breadboard hole coordinates
      return getBreadboardHoleCoords(ep.pinId);
    }

    // Component pin
    const comp = components.find((c) => c.id === ep.componentId);
    if (comp) {
      const baseIdx = components.indexOf(comp);
      const cx = 580 + (baseIdx % 2) * 120;
      const cy = 60 + Math.floor(baseIdx / 2) * 90;
      return { x: cx, y: cy };
    }

    return { x: 200, y: 200 };
  };

  // Helper: map breadboard hole ID to SVG coordinates (X, Y)
  const getBreadboardHoleCoords = (holeId: string): { x: number; y: number } => {
    const bbOriginX = 40;
    const bbOriginY = 250;
    const colSpacing = 19;
    const rowSpacing = 16;

    if (holeId.startsWith('bb-rail-top-plus')) {
      const idx = parseInt(holeId.replace('bb-rail-top-plus-', ''), 10) || 0;
      return { x: bbOriginX + 35 + idx * colSpacing, y: bbOriginY + 20 };
    }
    if (holeId.startsWith('bb-rail-top-minus')) {
      const idx = parseInt(holeId.replace('bb-rail-top-minus-', ''), 10) || 0;
      return { x: bbOriginX + 35 + idx * colSpacing, y: bbOriginY + 36 };
    }
    if (holeId.startsWith('bb-rail-bot-plus')) {
      const idx = parseInt(holeId.replace('bb-rail-bot-plus-', ''), 10) || 0;
      return { x: bbOriginX + 35 + idx * colSpacing, y: bbOriginY + 184 };
    }
    if (holeId.startsWith('bb-rail-bot-minus')) {
      const idx = parseInt(holeId.replace('bb-rail-bot-minus-', ''), 10) || 0;
      return { x: bbOriginX + 35 + idx * colSpacing, y: bbOriginY + 200 };
    }

    const match = holeId.match(/bb-row-(\d+)-([a-j])/i);
    if (match) {
      const row = parseInt(match[1], 10); // 1 to 30
      const colLetter = match[2].toLowerCase(); // a to j
      const colIdx = 'abcde'.includes(colLetter)
        ? 'abcde'.indexOf(colLetter)
        : 6 + 'fghij'.indexOf(colLetter);

      const x = bbOriginX + 35 + (row - 1) * colSpacing;
      const y = colIdx < 5
        ? bbOriginY + 62 + colIdx * rowSpacing
        : bbOriginY + 74 + colIdx * rowSpacing;

      return { x, y };
    }

    return { x: bbOriginX + 100, y: bbOriginY + 100 };
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl text-slate-100 select-none">
      {/* 1. Canvas Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wire Tool:</span>
          </span>

          {/* Wire Color Palette */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(Object.keys(WIRE_COLORS) as WireColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveWireColor(c)}
                className={`w-5 h-5 rounded-full border transition cursor-pointer flex items-center justify-center ${
                  activeWireColor === c
                    ? 'ring-2 ring-cyan-400 scale-110 shadow-sm border-white'
                    : 'border-slate-700 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: WIRE_COLORS[c].hex }}
                title={`${WIRE_COLORS[c].name} wire: ${WIRE_COLORS[c].desc}`}
              />
            ))}
          </div>

          <span className="text-[11px] text-slate-300 font-mono hidden sm:inline ml-1">
            [{WIRE_COLORS[activeWireColor].name}]
          </span>

          {wireStart && (
            <button
              type="button"
              onClick={() => {
                setWireStart(null);
                setMousePos(null);
                setStatusMessage('Wire creation cancelled.');
              }}
              className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 cursor-pointer ml-1"
            >
              Cancel Wire (Esc)
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom & Fit Canvas Controls */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1.5 text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition cursor-pointer ml-0.5"
              title="Fit to Screen (100%)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {wires.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllWires}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Delete all jumper wires"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Clear Wires ({wires.length})</span>
            </button>
          )}

          <div className="text-[11px] font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
            Nets: <span className="text-cyan-400">{Object.keys(validation.connectedNets).length}</span> | Wires:{' '}
            <span className="text-emerald-400">{wires.length}</span>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="px-3 py-1.5 bg-cyan-950/60 border-b border-cyan-800/50 text-[11px] text-cyan-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-cyan-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Interactive SVG Canvas */}
      <div className="flex-1 min-h-[380px] overflow-auto relative bg-[#0b101b] p-3 flex justify-center items-start">
        <svg
          ref={svgRef}
          width="740"
          height="490"
          viewBox="0 0 740 490"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="bg-[#0b101b] rounded-xl border border-slate-800 shadow-inner select-none"
          onMouseMove={handleMouseMove}
          onClick={() => {
            if (!wireStart) setSelectedWireId(null);
          }}
        >
          <defs>
            {/* Grid Pattern for engineering canvas */}
            <pattern id="canvas-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.7" opacity="0.4" />
            </pattern>

            {/* LED Glow Radial Gradients */}
            <radialGradient id="led-glow-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
              <stop offset="60%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="led-glow-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="led-glow-blue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width="740" height="490" fill="url(#canvas-grid)" />

          {/* ======================================================== */}
          {/* SECTION A: MICROCONTROLLER BOARD GRAPHIC (Top Left) */}
          {/* ======================================================== */}
          <g id="microcontroller-board" transform="translate(30, 20)">
            {/* Main Board PCB */}
            <rect
              x="0"
              y="0"
              width="360"
              height="200"
              rx="12"
              fill={board.startsWith('arduino') ? '#0284c7' : board.startsWith('esp') ? '#0f172a' : '#047857'}
              stroke="#38bdf8"
              strokeWidth="2"
              className="drop-shadow-lg"
            />

            {/* USB Connector */}
            <rect x="-8" y="30" width="30" height="34" rx="2" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="0" y="36" width="12" height="22" fill="#334155" />

            {/* Barrel Jack (Power) */}
            <rect x="-8" y="130" width="38" height="45" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

            {/* MCU Chip (ATmega328P / Xtensa LX6 / RP2040) */}
            <rect x="130" y="75" width="100" height="50" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            <text x="180" y="100" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {boardDef.mcu}
            </text>
            <text x="180" y="114" fill="#64748b" fontSize="7" fontFamily="sans-serif" textAnchor="middle">
              {boardDef.clockSpeed}
            </text>

            {/* Board Branding */}
            <text x="180" y="35" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
              {boardDef.name}
            </text>
            <text x="180" y="49" fill="#bae6fd" fontSize="8" fontFamily="monospace" textAnchor="middle">
              InnoLink Virtual Hardware • {boardDef.operatingVoltage}
            </text>

            {/* Power LED */}
            <circle x="30" y="90" r="3.5" fill="#10b981" />
            <text x="38" y="93" fill="#cbd5e1" fontSize="7" fontFamily="monospace">ON</text>

            {/* Built-in Pin 13 / GPIO 2 LED */}
            <circle
              cx="55"
              cy="90"
              r="4.5"
              fill={isSimulating ? '#eab308' : '#334155'}
              stroke="#ca8a04"
              strokeWidth="1"
            />
            {isSimulating && (
              <circle cx="55" cy="90" r="10" fill="#eab308" opacity="0.35" className="animate-pulse" />
            )}
            <text x="64" y="93" fill="#cbd5e1" fontSize="7" fontFamily="monospace">LED L</text>

            {/* Top Pin Header: Digital I/O (Pins 0 to 13, GND, AREF) */}
            <g id="top-pin-header" transform="translate(60, 6)">
              <rect x="-6" y="-4" width="288" height="22" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              {['SCL', 'SDA', 'AREF', 'GND', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'TX', 'RX'].map(
                (pinName, idx) => {
                  const px = idx * 16;
                  const py = 7;
                  const isHovered = wireStart?.type === 'board' && wireStart.pinId === pinName;

                  return (
                    <g
                      key={pinName}
                      className="cursor-pointer group"
                      onClick={() =>
                        handleEndpointClick({
                          type: 'board',
                          pinId: pinName,
                          label: `${boardDef.name} ${pinName}`,
                          x: 90 + px,
                          y: 33,
                        })
                      }
                    >
                      <circle
                        cx={px}
                        cy={py}
                        r="4.5"
                        fill="#0284c7"
                        stroke="#e2e8f0"
                        strokeWidth="1.5"
                        className="group-hover:fill-cyan-400 group-hover:scale-125 transition"
                      />
                      <circle cx={px} cy={py} r="1.5" fill="#0f172a" />
                      <text
                        x={px}
                        y={py + 18}
                        fill="#f8fafc"
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {pinName}
                      </text>
                    </g>
                  );
                }
              )}
            </g>

            {/* Bottom Pin Header: Power & Analog (VIN, GND, 5V, 3V3, A0-A5) */}
            <g id="bottom-pin-header" transform="translate(60, 175)">
              <rect x="-6" y="-2" width="288" height="22" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              {['VIN', 'GND', 'GND', '5V', '3V3', 'RST', 'IOREF', 'NC', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'].map(
                (pinName, idx) => {
                  const px = idx * 20;
                  const py = 9;

                  return (
                    <g
                      key={pinName + idx}
                      className="cursor-pointer group"
                      onClick={() =>
                        handleEndpointClick({
                          type: 'board',
                          pinId: pinName,
                          label: `${boardDef.name} ${pinName}`,
                          x: 90 + px,
                          y: 204,
                        })
                      }
                    >
                      <circle
                        cx={px}
                        cy={py}
                        r="4.5"
                        fill={pinName.includes('GND') ? '#475569' : pinName.includes('5V') || pinName.includes('3V3') ? '#ef4444' : '#0284c7'}
                        stroke="#e2e8f0"
                        strokeWidth="1.5"
                        className="group-hover:fill-cyan-400 group-hover:scale-125 transition"
                      />
                      <circle cx={px} cy={py} r="1.5" fill="#0f172a" />
                      <text
                        x={px}
                        y={py - 10}
                        fill="#f8fafc"
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {pinName}
                      </text>
                    </g>
                  );
                }
              )}
            </g>
          </g>

          {/* ======================================================== */}
          {/* SECTION B: SOLDERLESS BREADBOARD (Bottom Canvas) */}
          {/* ======================================================== */}
          <g id="breadboard" transform="translate(40, 240)">
            {/* Breadboard Plastic Body */}
            <rect
              x="0"
              y="0"
              width="660"
              height="225"
              rx="10"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="2"
              className="drop-shadow-md"
            />

            {/* Center Isolation Trench (divider for ICs) */}
            <rect x="25" y="112" width="610" height="8" rx="2" fill="#cbd5e1" />

            {/* Top Power Rail Stripes: Red (+) and Blue (-) */}
            <line x1="30" y1="20" x2="635" y2="20" stroke="#ef4444" strokeWidth="2.5" opacity="0.85" />
            <line x1="30" y1="36" x2="635" y2="36" stroke="#3b82f6" strokeWidth="2.5" opacity="0.85" />
            <text x="18" y="23" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace">+</text>
            <text x="18" y="39" fill="#3b82f6" fontSize="14" fontWeight="bold" fontFamily="monospace">-</text>

            {/* Bottom Power Rail Stripes: Red (+) and Blue (-) */}
            <line x1="30" y1="184" x2="635" y2="184" stroke="#ef4444" strokeWidth="2.5" opacity="0.85" />
            <line x1="30" y1="200" x2="635" y2="200" stroke="#3b82f6" strokeWidth="2.5" opacity="0.85" />
            <text x="18" y="187" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace">+</text>
            <text x="18" y="203" fill="#3b82f6" fontSize="14" fontWeight="bold" fontFamily="monospace">-</text>

            {/* Column Label Letters on left and right */}
            {['A', 'B', 'C', 'D', 'E'].map((letter, idx) => (
              <text key={letter} x="18" y={65 + idx * 12} fill="#64748b" fontSize="7" fontWeight="bold" fontFamily="monospace">
                {letter}
              </text>
            ))}
            {['F', 'G', 'H', 'I', 'J'].map((letter, idx) => (
              <text key={letter} x="18" y={135 + idx * 12} fill="#64748b" fontSize="7" fontWeight="bold" fontFamily="monospace">
                {letter}
              </text>
            ))}

            {/* Top Power Rail Holes (25 tie points each) */}
            {Array.from({ length: 25 }, (_, idx) => {
              const hx = 42 + idx * 24;
              return (
                <g key={`top-rail-${idx}`}>
                  {/* Plus hole */}
                  <circle
                    cx={hx}
                    cy={20}
                    r="3.5"
                    fill="#1e293b"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    className="cursor-pointer hover:fill-red-500 hover:scale-125 transition"
                    onClick={() =>
                      handleEndpointClick({
                        type: 'breadboard',
                        pinId: `bb-rail-top-plus-${idx}`,
                        label: `Breadboard Top (+) Rail [${idx + 1}]`,
                        x: 40 + hx,
                        y: 260,
                      })
                    }
                  />
                  {/* Minus hole */}
                  <circle
                    cx={hx}
                    cy={36}
                    r="3.5"
                    fill="#1e293b"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    className="cursor-pointer hover:fill-blue-500 hover:scale-125 transition"
                    onClick={() =>
                      handleEndpointClick({
                        type: 'breadboard',
                        pinId: `bb-rail-top-minus-${idx}`,
                        label: `Breadboard Top (-) GND Rail [${idx + 1}]`,
                        x: 40 + hx,
                        y: 276,
                      })
                    }
                  />
                </g>
              );
            })}

            {/* 30 Terminal Rows (Rows 1 to 30, Columns A to E and F to J) */}
            {Array.from({ length: 30 }, (_, rIdx) => {
              const rowNum = rIdx + 1;
              const rx = 35 + rIdx * 20;

              return (
                <g key={`bb-row-${rowNum}`}>
                  {/* Row number label */}
                  {rowNum % 5 === 0 || rowNum === 1 ? (
                    <text x={rx} y={50} fill="#94a3b8" fontSize="7" textAnchor="middle" fontFamily="monospace">
                      {rowNum}
                    </text>
                  ) : null}

                  {/* Top section holes: A, B, C, D, E */}
                  {['a', 'b', 'c', 'd', 'e'].map((colLetter, cIdx) => {
                    const hy = 62 + cIdx * 10;
                    const holeId = `bb-row-${rowNum}-${colLetter}`;
                    const netId = getBreadboardInternalNet(holeId);
                    const isNetHovered = hoveredNet === netId;

                    return (
                      <circle
                        key={holeId}
                        cx={rx}
                        cy={hy}
                        r="3.2"
                        fill={isNetHovered ? '#38bdf8' : '#1e293b'}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        className="cursor-pointer hover:fill-cyan-400 hover:scale-125 transition"
                        onMouseEnter={() => setHoveredNet(netId)}
                        onMouseLeave={() => setHoveredNet(null)}
                        onClick={() =>
                          handleEndpointClick({
                            type: 'breadboard',
                            pinId: holeId,
                            label: `Breadboard Row ${rowNum} Col ${colLetter.toUpperCase()}`,
                            x: 40 + rx,
                            y: 240 + hy,
                          })
                        }
                      />
                    );
                  })}

                  {/* Bottom section holes: F, G, H, I, J */}
                  {['f', 'g', 'h', 'i', 'j'].map((colLetter, cIdx) => {
                    const hy = 132 + cIdx * 10;
                    const holeId = `bb-row-${rowNum}-${colLetter}`;
                    const netId = getBreadboardInternalNet(holeId);
                    const isNetHovered = hoveredNet === netId;

                    return (
                      <circle
                        key={holeId}
                        cx={rx}
                        cy={hy}
                        r="3.2"
                        fill={isNetHovered ? '#38bdf8' : '#1e293b'}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        className="cursor-pointer hover:fill-cyan-400 hover:scale-125 transition"
                        onMouseEnter={() => setHoveredNet(netId)}
                        onMouseLeave={() => setHoveredNet(null)}
                        onClick={() =>
                          handleEndpointClick({
                            type: 'breadboard',
                            pinId: holeId,
                            label: `Breadboard Row ${rowNum} Col ${colLetter.toUpperCase()}`,
                            x: 40 + rx,
                            y: 240 + hy,
                          })
                        }
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Bottom Power Rail Holes */}
            {Array.from({ length: 25 }, (_, idx) => {
              const hx = 42 + idx * 24;
              return (
                <g key={`bot-rail-${idx}`}>
                  {/* Plus hole */}
                  <circle
                    cx={hx}
                    cy={184}
                    r="3.5"
                    fill="#1e293b"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    className="cursor-pointer hover:fill-red-500 hover:scale-125 transition"
                    onClick={() =>
                      handleEndpointClick({
                        type: 'breadboard',
                        pinId: `bb-rail-bot-plus-${idx}`,
                        label: `Breadboard Bottom (+) Rail [${idx + 1}]`,
                        x: 40 + hx,
                        y: 424,
                      })
                    }
                  />
                  {/* Minus hole */}
                  <circle
                    cx={hx}
                    cy={200}
                    r="3.5"
                    fill="#1e293b"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    className="cursor-pointer hover:fill-blue-500 hover:scale-125 transition"
                    onClick={() =>
                      handleEndpointClick({
                        type: 'breadboard',
                        pinId: `bb-rail-bot-minus-${idx}`,
                        label: `Breadboard Bottom (-) GND Rail [${idx + 1}]`,
                        x: 40 + hx,
                        y: 440,
                      })
                    }
                  />
                </g>
              );
            })}
          </g>

          {/* ======================================================== */}
          {/* SECTION C: PLACED COMPONENTS ON CANVAS (Top Right) */}
          {/* ======================================================== */}
          <g id="placed-components" transform="translate(420, 20)">
            {components.map((comp, idx) => {
              const cx = (idx % 3) * 98;
              const cy = Math.floor(idx / 3) * 98;
              const isSelected = selectedComponentId === comp.id;
              const isLedGlowing = isSimulating && validation.activeOutputs.leds[comp.id]?.state;

              return (
                <g
                  key={comp.id}
                  transform={`translate(${cx}, ${cy})`}
                  className="cursor-pointer"
                  onClick={() => onSelectComponent && onSelectComponent(comp.id)}
                >
                  {/* Component Container Box */}
                  <rect
                    x="0"
                    y="0"
                    width="90"
                    height="85"
                    rx="8"
                    fill="#1e293b"
                    stroke={isSelected ? '#38bdf8' : '#334155'}
                    strokeWidth={isSelected ? '2' : '1'}
                    className="drop-shadow-md"
                  />

                  {/* Component Label */}
                  <text x="45" y="14" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle">
                    {comp.label.length > 15 ? comp.label.slice(0, 15) + '…' : comp.label}
                  </text>

                  {/* Component Vector Visualizations */}
                  {comp.type === 'led' && (
                    <g transform="translate(45, 42)">
                      {/* Glow effect when high */}
                      {isLedGlowing && (
                        <circle
                          cx="0"
                          cy="0"
                          r="22"
                          fill={`url(#led-glow-${comp.color || 'red'})`}
                          className="animate-pulse"
                        />
                      )}
                      {/* LED Bulb */}
                      <circle
                        cx="0"
                        cy="0"
                        r="12"
                        fill={comp.color === 'green' ? '#10b981' : comp.color === 'blue' ? '#3b82f6' : '#ef4444'}
                        opacity={isLedGlowing ? 1 : 0.65}
                        stroke="#f8fafc"
                        strokeWidth="1.5"
                      />
                      <circle cx="-3" cy="-3" r="3" fill="#ffffff" opacity="0.6" />

                      {/* Pins (Anode + and Cathode -) */}
                      <g
                        className="group"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'anode',
                            label: `${comp.label} Anode (+)`,
                            x: 420 + cx + 32,
                            y: 20 + cy + 70,
                          });
                        }}
                      >
                        <circle cx="-13" cy="28" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                        <text x="-13" y="24" fill="#ef4444" fontSize="6" fontWeight="bold" textAnchor="middle">+</text>
                      </g>
                      <g
                        className="group"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'cathode',
                            label: `${comp.label} Cathode (-)`,
                            x: 420 + cx + 58,
                            y: 20 + cy + 70,
                          });
                        }}
                      >
                        <circle cx="13" cy="28" r="4" fill="#475569" stroke="#ffffff" strokeWidth="1" />
                        <text x="13" y="24" fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle">-</text>
                      </g>
                    </g>
                  )}

                  {comp.type === 'resistor' && (
                    <g transform="translate(45, 42)">
                      {/* Resistor Body */}
                      <rect x="-18" y="-6" width="36" height="12" rx="4" fill="#d97706" stroke="#b45309" strokeWidth="1" />
                      {/* Color bands for 220Ω (Red, Red, Brown, Gold) */}
                      <rect x="-10" y="-6" width="3" height="12" fill="#dc2626" />
                      <rect x="-4" y="-6" width="3" height="12" fill="#dc2626" />
                      <rect x="2" y="-6" width="3" height="12" fill="#78350f" />
                      <rect x="8" y="-6" width="3" height="12" fill="#fbbf24" />

                      {/* Terminals */}
                      <circle
                        cx="-26"
                        cy="28"
                        r="4"
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'pin1',
                            label: `${comp.label} Pin 1`,
                            x: 420 + cx + 19,
                            y: 20 + cy + 70,
                          });
                        }}
                      />
                      <circle
                        cx="26"
                        cy="28"
                        r="4"
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'pin2',
                            label: `${comp.label} Pin 2`,
                            x: 420 + cx + 71,
                            y: 20 + cy + 70,
                          });
                        }}
                      />
                    </g>
                  )}

                  {comp.type === 'push_button' && (
                    <g transform="translate(45, 40)">
                      {/* Button Casing */}
                      <rect x="-16" y="-14" width="32" height="28" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
                      {/* Pushable Cap */}
                      <circle
                        cx="0"
                        cy="0"
                        r="9"
                        fill={comp.state?.digitalValue ? '#10b981' : '#dc2626'}
                        className="cursor-pointer hover:scale-105 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateComponentState(comp.id, { digitalValue: !comp.state?.digitalValue });
                        }}
                      />
                      <text x="0" y="3" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">
                        {comp.state?.digitalValue ? 'PUSH' : 'OFF'}
                      </text>

                      {/* Pins */}
                      <circle
                        cx="-16"
                        cy="28"
                        r="4"
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'signal',
                            label: `${comp.label} Signal`,
                            x: 420 + cx + 29,
                            y: 20 + cy + 68,
                          });
                        }}
                      />
                      <circle
                        cx="16"
                        cy="28"
                        r="4"
                        fill="#475569"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'gnd',
                            label: `${comp.label} GND`,
                            x: 420 + cx + 61,
                            y: 20 + cy + 68,
                          });
                        }}
                      />
                    </g>
                  )}

                  {comp.type === 'buzzer' && (
                    <g transform="translate(45, 40)">
                      <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                      <circle cx="0" cy="0" r="4" fill="#334155" />
                      {isSimulating && validation.activeOutputs.buzzers[comp.id]?.active && (
                        <circle cx="0" cy="0" r="20" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-ping" />
                      )}
                      <circle
                        cx="-10"
                        cy="28"
                        r="4"
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'pos',
                            label: `${comp.label} (+)`,
                            x: 420 + cx + 35,
                            y: 20 + cy + 68,
                          });
                        }}
                      />
                      <circle
                        cx="10"
                        cy="28"
                        r="4"
                        fill="#475569"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'neg',
                            label: `${comp.label} (-)`,
                            x: 420 + cx + 55,
                            y: 20 + cy + 68,
                          });
                        }}
                      />
                    </g>
                  )}

                  {comp.type === 'potentiometer' && (
                    <g transform="translate(45, 40)">
                      {/* Potentiometer Dial */}
                      <circle cx="0" cy="-2" r="15" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                      <circle cx="0" cy="-2" r="8" fill="#0f172a" />
                      {/* Wiper Needle based on analogValue (0-1023) */}
                      {(() => {
                        const val = comp.state?.analogValue ?? 512;
                        const angle = -135 + (val / 1023) * 270;
                        const rad = (angle * Math.PI) / 180;
                        const nx = Math.cos(rad) * 12;
                        const ny = -2 + Math.sin(rad) * 12;
                        return <line x1="0" y1="-2" x2={nx} y2={ny} stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />;
                      })()}

                      {/* Terminals: VCC (pin 1), Wiper / Signal (pin 2), GND (pin 3) */}
                      <circle
                        cx="-16"
                        cy="28"
                        r="4"
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'vcc',
                            label: `${comp.label} VCC`,
                            x: 420 + cx + 29,
                            y: 20 + cy + 68,
                          });
                        }}
                      />
                      <circle
                        cx="0"
                        cy="28"
                        r="4"
                        fill="#eab308"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'signal',
                            label: `${comp.label} Wiper`,
                            x: 420 + cx + 45,
                            y: 20 + cy + 68,
                          });
                        }}
                      />
                      <circle
                        cx="16"
                        cy="28"
                        r="4"
                        fill="#475569"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'gnd',
                            label: `${comp.label} GND`,
                            x: 420 + cx + 61,
                            y: 20 + cy + 68,
                          });
                        }}
                      />
                    </g>
                  )}

                  {comp.type === 'servo' && (
                    <g transform="translate(45, 38)">
                      {/* Micro Servo Body */}
                      <rect x="-22" y="-14" width="44" height="26" rx="3" fill="#1d4ed8" stroke="#3b82f6" strokeWidth="1" />
                      {/* Rotating Horn */}
                      <g transform={`rotate(${comp.state?.angle ?? 90})`}>
                        <rect x="-3" y="-12" width="6" height="24" rx="2" fill="#ffffff" opacity="0.9" />
                        <circle cx="0" cy="0" r="5" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
                      </g>

                      {/* Terminals: Signal (orange), 5V (red), GND (black) */}
                      <circle
                        cx="-14"
                        cy="28"
                        r="4"
                        fill="#f97316"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'signal',
                            label: `${comp.label} PWM`,
                            x: 420 + cx + 31,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                      <circle
                        cx="0"
                        cy="28"
                        r="4"
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'vcc',
                            label: `${comp.label} 5V`,
                            x: 420 + cx + 45,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                      <circle
                        cx="14"
                        cy="28"
                        r="4"
                        fill="#475569"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'gnd',
                            label: `${comp.label} GND`,
                            x: 420 + cx + 59,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                    </g>
                  )}

                  {comp.type === 'ultrasonic_sensor' && (
                    <g transform="translate(45, 38)">
                      {/* HC-SR04 PCB */}
                      <rect x="-28" y="-14" width="56" height="26" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                      {/* Dual Transducer Cans (T and R) */}
                      <circle cx="-13" cy="-1" r="9" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
                      <circle cx="-13" cy="-1" r="5" fill="#334155" />
                      <circle cx="13" cy="-1" r="9" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
                      <circle cx="13" cy="-1" r="5" fill="#334155" />

                      {/* 4 Terminals: VCC, Trig, Echo, GND */}
                      <circle
                        cx="-21"
                        cy="28"
                        r="3.5"
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'vcc',
                            label: `${comp.label} VCC`,
                            x: 420 + cx + 24,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                      <circle
                        cx="-7"
                        cy="28"
                        r="3.5"
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'trig',
                            label: `${comp.label} Trig`,
                            x: 420 + cx + 38,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                      <circle
                        cx="7"
                        cy="28"
                        r="3.5"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'echo',
                            label: `${comp.label} Echo`,
                            x: 420 + cx + 52,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                      <circle
                        cx="21"
                        cy="28"
                        r="3.5"
                        fill="#475569"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'gnd',
                            label: `${comp.label} GND`,
                            x: 420 + cx + 66,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                    </g>
                  )}

                  {comp.type === 'lcd_16x2' && (
                    <g transform="translate(45, 38)">
                      <rect x="-32" y="-15" width="64" height="28" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                      <rect x="-28" y="-12" width="56" height="20" rx="1" fill="#0f172a" stroke="#1e293b" />
                      <text x="-24" y="-3" fill="#10b981" fontSize="5" fontFamily="monospace">
                        {(validation.activeOutputs.lcds[comp.id]?.line1 || 'InnoLink 16x2').slice(0, 10)}
                      </text>
                      <text x="-24" y="5" fill="#10b981" fontSize="5" fontFamily="monospace">
                        {(validation.activeOutputs.lcds[comp.id]?.line2 || 'Virtual Ready').slice(0, 10)}
                      </text>

                      {/* 4 I2C Pins: GND, VCC, SDA, SCL */}
                      <circle
                        cx="-21"
                        cy="28"
                        r="3.5"
                        fill="#475569"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'gnd',
                            label: `${comp.label} GND`,
                            x: 420 + cx + 24,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                      <circle
                        cx="-7"
                        cy="28"
                        r="3.5"
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'vcc',
                            label: `${comp.label} VCC`,
                            x: 420 + cx + 38,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                      <circle
                        cx="7"
                        cy="28"
                        r="3.5"
                        fill="#38bdf8"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'sda',
                            label: `${comp.label} SDA`,
                            x: 420 + cx + 52,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                      <circle
                        cx="21"
                        cy="28"
                        r="3.5"
                        fill="#facc15"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'scl',
                            label: `${comp.label} SCL`,
                            x: 420 + cx + 66,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                    </g>
                  )}

                  {comp.type === 'multimeter' && (
                    <g transform="translate(45, 38)">
                      {/* DMM body */}
                      <rect x="-24" y="-15" width="48" height="28" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                      <rect x="-18" y="-11" width="36" height="12" rx="2" fill="#0f172a" />
                      <text x="0" y="-3" fill="#10b981" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        {isSimulating ? '5.00 V' : '0.00 V'}
                      </text>

                      {/* 2 Sockets: Red Probe (+) and Black Probe (-) */}
                      <circle
                        cx="-10"
                        cy="28"
                        r="4"
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'probe_red',
                            label: `${comp.label} Red (+)`,
                            x: 420 + cx + 35,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                      <circle
                        cx="10"
                        cy="28"
                        r="4"
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth="1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndpointClick({
                            type: 'component',
                            componentId: comp.id,
                            pinId: 'probe_black',
                            label: `${comp.label} COM (-)`,
                            x: 420 + cx + 55,
                            y: 20 + cy + 66,
                          });
                        }}
                      />
                    </g>
                  )}

                  {comp.type !== 'led' &&
                    comp.type !== 'resistor' &&
                    comp.type !== 'push_button' &&
                    comp.type !== 'buzzer' &&
                    comp.type !== 'potentiometer' &&
                    comp.type !== 'servo' &&
                    comp.type !== 'ultrasonic_sensor' &&
                    comp.type !== 'lcd_16x2' &&
                    comp.type !== 'multimeter' && (
                      <g transform="translate(45, 40)">
                        <rect x="-22" y="-14" width="44" height="26" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                        <text x="0" y="2" fill="#38bdf8" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                          {comp.type.slice(0, 8).toUpperCase()}
                        </text>
                        {/* 2 terminals */}
                        <circle
                          cx="-12"
                          cy="28"
                          r="4"
                          fill="#0284c7"
                          stroke="#ffffff"
                          strokeWidth="1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEndpointClick({
                              type: 'component',
                              componentId: comp.id,
                              pinId: 'pin1',
                              label: `${comp.label} Pin 1`,
                              x: 420 + cx + 33,
                              y: 20 + cy + 68,
                            });
                          }}
                        />
                        <circle
                          cx="12"
                          cy="28"
                          r="4"
                          fill="#475569"
                          stroke="#ffffff"
                          strokeWidth="1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEndpointClick({
                              type: 'component',
                              componentId: comp.id,
                              pinId: 'pin2',
                              label: `${comp.label} Pin 2`,
                              x: 420 + cx + 57,
                              y: 20 + cy + 68,
                            });
                          }}
                        />
                      </g>
                    )}
                </g>
              );
            })}
          </g>

          {/* ======================================================== */}
          {/* SECTION D: JUMPER WIRES (Rendered as curved bezier paths) */}
          {/* ======================================================== */}
          <g id="jumper-wires">
            {wires.map((wire) => {
              const p1 = getEndpointCoords(wire.from);
              const p2 = getEndpointCoords(wire.to);
              const isSelected = selectedWireId === wire.id;
              const wireHex = WIRE_COLORS[wire.color]?.hex || '#ef4444';

              // Calculate natural gravitational wire droop (sag)
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const sag = Math.min(60, Math.max(20, dist * 0.22));

              const cp1x = p1.x;
              const cp1y = p1.y + sag;
              const cp2x = p2.x;
              const cp2y = p2.y + sag;

              const pathD = `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;

              return (
                <g
                  key={wire.id}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWireId(wire.id);
                    setStatusMessage(`Selected ${wire.color} wire (${wire.from.label} ↔ ${wire.to.label}). Press Delete to remove.`);
                  }}
                >
                  {/* Outer selection halo */}
                  {isSelected && (
                    <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="7" strokeDasharray="4 3" opacity="0.8" />
                  )}

                  {/* Wide invisible path for easy clicking */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="14" />

                  {/* Core Wire Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={wireHex}
                    strokeWidth={isSelected ? '3.5' : '2.8'}
                    strokeLinecap="round"
                    className="group-hover:stroke-cyan-300 transition"
                  />

                  {/* Metal Pin Terminal Connectors */}
                  <circle cx={p1.x} cy={p1.y} r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                  <circle cx={p2.x} cy={p2.y} r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                </g>
              );
            })}

            {/* In-progress wire currently stretching from wireStart to mouse */}
            {wireStart && mousePos && (
              <g>
                {(() => {
                  const p1 = getEndpointCoords(wireStart);
                  const p2 = mousePos;
                  const dx = p2.x - p1.x;
                  const sag = Math.min(50, Math.max(15, Math.abs(dx) * 0.2));
                  const pathD = `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + sag}, ${p2.x} ${p2.y + sag}, ${p2.x} ${p2.y}`;

                  return (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={WIRE_COLORS[activeWireColor].hex}
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      className="animate-pulse"
                    />
                  );
                })()}
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* 3. Bottom Control Dock (Interactive sliders for simulation sensors) */}
      {components.some((c) => c.type === 'potentiometer' || c.type === 'ultrasonic_sensor') && (
        <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs">
          {components
            .filter((c) => c.type === 'potentiometer' || c.type === 'ultrasonic_sensor')
            .map((comp) => (
              <div key={comp.id} className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-200">{comp.label}:</span>
                {comp.type === 'potentiometer' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1023"
                      value={comp.state?.analogValue ?? 512}
                      onChange={(e) => updateComponentState(comp.id, { analogValue: parseInt(e.target.value, 10) })}
                      className="w-24 accent-cyan-400"
                    />
                    <span className="font-mono text-cyan-400 text-[11px] w-10">
                      {comp.state?.analogValue ?? 512}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="2"
                      max="200"
                      value={comp.state?.distance ?? 25}
                      onChange={(e) => updateComponentState(comp.id, { distance: parseInt(e.target.value, 10) })}
                      className="w-24 accent-cyan-400"
                    />
                    <span className="font-mono text-cyan-400 text-[11px] w-12">
                      {comp.state?.distance ?? 25} cm
                    </span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
