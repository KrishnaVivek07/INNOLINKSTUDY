import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  Search,
  ChevronDown,
  Check,
  X,
  Zap,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { HardwareBoard } from '../../types';
import { BOARD_REGISTRY, BoardDefinition } from '../../lib/boardRegistry';

interface SearchableBoardSelectorProps {
  selectedBoard: HardwareBoard;
  onChangeBoard: (board: HardwareBoard) => void;
  className?: string;
}

type BoardFamilyFilter = 'all' | 'arduino' | 'esp32' | 'pico' | 'raspberry_pi' | 'stm32' | 'teensy';

const FAMILY_FILTERS: { id: BoardFamilyFilter; label: string }[] = [
  { id: 'all', label: 'All Boards' },
  { id: 'arduino', label: 'Arduino' },
  { id: 'esp32', label: 'ESP32' },
  { id: 'pico', label: 'RPi Pico' },
  { id: 'raspberry_pi', label: 'Raspberry Pi SBC' },
  { id: 'stm32', label: 'STM32' },
  { id: 'teensy', label: 'Teensy' },
];

export const SearchableBoardSelector: React.FC<SearchableBoardSelectorProps> = ({
  selectedBoard,
  onChangeBoard,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<BoardFamilyFilter>('all');
  const [showDetails, setShowDetails] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeBoardDef = BOARD_REGISTRY[selectedBoard] || BOARD_REGISTRY.arduino_uno;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const allBoards = Object.values(BOARD_REGISTRY) as BoardDefinition[];

  const filteredBoards = allBoards.filter((board) => {
    // Filter by family
    if (selectedFamily !== 'all') {
      if (selectedFamily === 'arduino' && board.family !== 'arduino') return false;
      if (selectedFamily === 'esp32' && board.family !== 'esp32') return false;
      if (selectedFamily === 'pico' && board.family !== 'raspberry_pi_pico') return false;
      if (selectedFamily === 'raspberry_pi' && board.family !== 'raspberry_pi') return false;
      if (selectedFamily === 'stm32' && board.family !== 'stm32') return false;
      if (selectedFamily === 'teensy' && board.family !== 'teensy') return false;
    }

    // Filter by search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      board.name.toLowerCase().includes(q) ||
      board.mcu.toLowerCase().includes(q) ||
      board.family.toLowerCase().includes(q) ||
      board.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-100 transition cursor-pointer text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-xs"
          title="Change Target Board / Microcontroller"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div className="flex items-center gap-1.5 max-w-[140px] sm:max-w-[190px] truncate">
            <span className="font-semibold text-white truncate">{activeBoardDef.name}</span>
            <span className="hidden md:inline text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              {activeBoardDef.mcu}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
              isOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </button>

        {/* Board Details Quick Info Button */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className={`p-1.5 rounded-lg border text-xs transition cursor-pointer hidden lg:flex items-center justify-center ${
            showDetails
              ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
          title="View Target Board Specs & Pinout Details"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Searchable Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-950 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[460px]">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-900/90 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Select Target Embedded Platform</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search board, MCU (e.g. Uno, ESP32, Pico, STM32)..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Family Category Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {FAMILY_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFamily(f.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0 transition cursor-pointer border ${
                    selectedFamily === f.id
                      ? 'border-cyan-500 bg-cyan-600 text-white font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Boards List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 overscroll-contain">
            {filteredBoards.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching boards found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredBoards.map((b) => {
                const isSelected = b.id === selectedBoard;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onChangeBoard(b.id as HardwareBoard);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200'
                        : 'border-transparent hover:bg-slate-900 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div
                        className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
                          isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-white truncate">{b.name}</span>
                          {b.category === 'single_board_computer' && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                              Linux SBC
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono mt-0.5 truncate">
                          <span>MCU: {b.mcu}</span>
                          <span>•</span>
                          <span>{b.clockSpeed}</span>
                          <span>•</span>
                          <span>{b.operatingVoltage}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2 border-t border-slate-800 bg-slate-900/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Selected: <strong className="text-slate-200">{activeBoardDef.name}</strong></span>
            <span className="font-mono text-cyan-400">{activeBoardDef.clockSpeed} • {activeBoardDef.operatingVoltage}</span>
          </div>
        </div>
      )}

      {/* Board Details Modal / Popover */}
      {showDetails && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-950 shadow-2xl z-40 p-3 text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeBoardDef.name} Architecture</span>
            </span>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Microcontroller / CPU</span>
              <span className="font-mono font-semibold text-cyan-300">{activeBoardDef.mcu}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Operating Voltage</span>
              <span className="font-mono font-semibold text-emerald-300">{activeBoardDef.operatingVoltage}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Clock Frequency</span>
              <span className="font-mono font-semibold text-amber-300">{activeBoardDef.clockSpeed}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Flash Storage</span>
              <span className="font-mono font-semibold text-purple-300">{activeBoardDef.flashSize}</span>
            </div>
          </div>

          {activeBoardDef.features && activeBoardDef.features.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Features</span>
              <div className="flex flex-wrap gap-1">
                {activeBoardDef.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
