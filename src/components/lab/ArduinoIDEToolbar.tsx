import React, { useState } from 'react';
import {
  Check,
  Upload,
  Terminal,
  FolderOpen,
  Save,
  Maximize2,
  Minimize2,
  Columns,
  Square,
  Play,
  Settings,
  Usb,
  RotateCw,
  Zap,
  HelpCircle,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { HardwareBoard } from '../../types';
import { BOARD_REGISTRY } from '../../lib/boardRegistry';
import { SearchableBoardSelector } from './SearchableBoardSelector';

interface ArduinoIDEToolbarProps {
  selectedBoard: HardwareBoard;
  onChangeBoard: (board: HardwareBoard) => void;
  selectedPort: string;
  onChangePort: (port: string) => void;
  onVerify: () => void;
  isVerifying: boolean;
  onCheckCircuit?: () => void;
  isCheckingCircuit?: boolean;
  onUpload: () => void;
  isUploading: boolean;
  uploadProgress: number;
  showSerialMonitor: boolean;
  onToggleSerialMonitor: () => void;
  onImportClick: () => void;
  onSave: () => void;
  layoutMode: 'normal' | 'split' | 'fullscreen';
  onChangeLayoutMode: (mode: 'normal' | 'split' | 'fullscreen') => void;
  baudRate: number;
  onChangeBaudRate: (rate: number) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  availablePorts?: string[];
  className?: string;
}

export const ArduinoIDEToolbar: React.FC<ArduinoIDEToolbarProps> = ({
  selectedBoard,
  onChangeBoard,
  selectedPort,
  onChangePort,
  onVerify,
  isVerifying,
  onCheckCircuit,
  isCheckingCircuit = false,
  onUpload,
  isUploading,
  uploadProgress,
  showSerialMonitor,
  onToggleSerialMonitor,
  onImportClick,
  onSave,
  layoutMode,
  onChangeLayoutMode,
  baudRate,
  onChangeBaudRate,
  isSimulating,
  onToggleSimulation,
  availablePorts = [
    'Virtual Simulator Port (/dev/pts/1)',
    'COM3 (Arduino Uno / Nano)',
    'COM4 (Silicon Labs CP210x ESP32)',
    '/dev/ttyUSB0 (ESP32 / Pico W)',
    '/dev/ttyACM0 (Raspberry Pi Pico RP2040)',
    'WebSerial (Browser Direct USB)',
  ],
  className = '',
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const boardDef = BOARD_REGISTRY[selectedBoard] || BOARD_REGISTRY.arduino_uno;
  // Upload is supported on microcontrollers. Raspberry Pi SBC executes Linux natively.
  const isUploadSupported = boardDef.category === 'microcontroller';

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-200 select-none ${className}`}
    >
      {/* Left: Primary Execution & Hardware Actions */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* 1. Verify / Build (Compile Code) */}
        <button
          type="button"
          onClick={onVerify}
          disabled={isVerifying || isUploading}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition cursor-pointer disabled:opacity-50 shadow-xs"
          title="Verify / Build (Syntax analysis & toolchain compilation)"
        >
          {isVerifying ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
          <span>{isVerifying ? 'Verifying...' : 'Verify'}</span>
        </button>

        {/* 2. Upload / Flash (Only for supported targets) */}
        <button
          type="button"
          onClick={onUpload}
          disabled={!isUploadSupported || isUploading || isVerifying}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer shadow-xs ${
            isUploadSupported
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
          title={
            isUploadSupported
              ? `Upload & Flash compiled binary to ${boardDef.name} on ${selectedPort}`
              : `${boardDef.name} is a Linux Single-Board Computer; code executes natively in Linux shell.`
          }
        >
          {isUploading ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
          <span>
            {isUploading
              ? `Uploading ${uploadProgress}%`
              : isUploadSupported
              ? 'Upload'
              : 'Upload (N/A)'}
          </span>
        </button>

        {/* 3. Run / Stop Simulation (Circuit Execution) */}
        <button
          type="button"
          onClick={onToggleSimulation}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer shadow-xs ${
            isSimulating
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          title={isSimulating ? 'Halt simulation execution' : 'Start circuit & firmware simulation'}
        >
          {isSimulating ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Run Simulation</span>
            </>
          )}
        </button>

        {/* 4. Check Circuit Wiring (Distinct from Code Compilation) */}
        {onCheckCircuit && (
          <button
            type="button"
            onClick={onCheckCircuit}
            disabled={isCheckingCircuit}
            className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-xs"
            title="Check Circuit Wiring: Validate component connections, power rails, resistors and ground pins"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Check Circuit</span>
          </button>
        )}

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* 5. Compact Searchable Board Selector */}
        <SearchableBoardSelector
          selectedBoard={selectedBoard}
          onChangeBoard={onChangeBoard}
        />

        {/* 6. Port / Device Selector */}
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
          <Usb className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <select
            value={selectedPort}
            onChange={(e) => onChangePort(e.target.value)}
            className="bg-transparent text-[11px] font-medium text-slate-100 focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[160px] truncate"
            title="Select Target Upload Port"
          >
            {availablePorts.map((port) => (
              <option key={port} value={port} className="bg-slate-900 text-white">
                {port}
              </option>
            ))}
          </select>
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-slate-800 mx-1 hidden md:block" />

        {/* 7. Serial Monitor Toggle Button */}
        <button
          type="button"
          onClick={onToggleSerialMonitor}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition cursor-pointer text-xs font-medium ${
            showSerialMonitor
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-200'
          }`}
          title="Toggle Docked Serial Monitor & Compiler Output"
        >
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Serial Monitor</span>
        </button>

        {/* 8. Open / Import Code */}
        <button
          type="button"
          onClick={onImportClick}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-200 transition cursor-pointer text-xs"
          title="Open / Import source code from device (.ino, .c, .cpp, .py, .java, .zip)"
        >
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Open</span>
        </button>

        {/* 9. Save Code */}
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-200 transition cursor-pointer text-xs"
          title="Save Sketch Project & Circuit State"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Save</span>
        </button>
      </div>

      {/* Right: Workspace Layout Controls & Settings */}
      <div className="flex items-center gap-1.5">
        {/* Layout View Toggles: Normal, Split View, Full Screen */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => onChangeLayoutMode('normal')}
            className={`px-2 py-1 rounded transition cursor-pointer text-[10px] font-medium ${
              layoutMode === 'normal'
                ? 'bg-slate-800 text-cyan-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Normal IDE View"
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => onChangeLayoutMode('split')}
            className={`px-2 py-1 rounded transition cursor-pointer text-[10px] font-medium flex items-center gap-1 ${
              layoutMode === 'split'
                ? 'bg-slate-800 text-cyan-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Split View (Editor & Circuit side-by-side)"
          >
            <Columns className="w-3 h-3" />
            <span className="hidden md:inline">Split</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeLayoutMode(layoutMode === 'fullscreen' ? 'normal' : 'fullscreen')}
            className={`px-2 py-1 rounded transition cursor-pointer text-[10px] font-medium flex items-center gap-1 ${
              layoutMode === 'fullscreen'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title={layoutMode === 'fullscreen' ? 'Exit Full Screen' : 'Full Screen IDE'}
          >
            {layoutMode === 'fullscreen' ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span className="hidden md:inline">Full</span>
              </>
            )}
          </button>
        </div>

        {/* Settings / More Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            title="IDE & Hardware Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-2xl z-50 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-semibold text-xs text-white">IDE & Serial Configuration</span>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 block">Serial Baud Rate</label>
                <select
                  value={baudRate}
                  onChange={(e) => onChangeBaudRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                >
                  <option value={9600}>9600 baud (Arduino Uno standard)</option>
                  <option value={19200}>19200 baud</option>
                  <option value={38400}>38400 baud</option>
                  <option value={57600}>57600 baud</option>
                  <option value={115200}>115200 baud (ESP32 & Pico standard)</option>
                  <option value={230400}>230400 baud (High speed)</option>
                </select>
              </div>

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800 space-y-1">
                <div>Active Target: <strong className="text-cyan-300">{boardDef.name}</strong></div>
                <div>Processor: <span className="font-mono text-slate-300">{boardDef.mcu}</span></div>
                <div>Clock Frequency: <span className="text-slate-300">{boardDef.clockSpeed}</span></div>
                <div>Logic Level: <span className="text-slate-300">{boardDef.operatingVoltage}</span></div>
                <div>Upload Mode: <span className="text-slate-300">{isUploadSupported ? 'Serial Flashing' : 'Native Process'}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
