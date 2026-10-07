import React, { useState } from 'react';
import { BlocklyEditor, ElectronicsBlock, compileBlocksToArduinoCode } from './BlocklyEditor';
import { Copy, Download, Code, Layers, Check, Sparkles, ArrowRight, Info } from 'lucide-react';
import { HardwareBoard } from '../../types';

interface HybridEditorProps {
  board: HardwareBoard;
  blocks: ElectronicsBlock[];
  onChangeBlocks: (blocks: ElectronicsBlock[]) => void;
  generatedCode: string;
  onCodeUpdated: (code: string) => void;
  className?: string;
}

export const HybridEditor: React.FC<HybridEditorProps> = ({
  board,
  blocks,
  onChangeBlocks,
  generatedCode,
  onCodeUpdated,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'split' | 'blocks' | 'code'>('split');

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Innolink_Hybrid_${board}.ino`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* View Switcher Tabs & Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'split' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('blocks')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'blocks' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Blocks Only</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'code' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Generated Code Only</span>
            </button>
          </div>
        </div>

        {/* Action Controls for Generated Code */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-cyan-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .INO</span>
          </button>
        </div>
      </div>

      {/* Strict Requirement Notice: Directionality */}
      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Hybrid Directionality Notice:</strong> Real-time conversion operates in{' '}
          <strong className="text-cyan-300">Blocks → Generated Code</strong> mode. Changes in visual blocks instantly recompile into authentic Arduino/ESP32 C++ code.
        </span>
      </div>

      {/* Main Container */}
      <div className={`grid gap-4 ${activeTab === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Blocks Column */}
        {(activeTab === 'split' || activeTab === 'blocks') && (
          <div className={activeTab === 'split' ? 'lg:col-span-7' : 'w-full'}>
            <BlocklyEditor
              board={board}
              blocks={blocks}
              onChangeBlocks={onChangeBlocks}
              onGenerateCode={onCodeUpdated}
            />
          </div>
        )}

        {/* Generated Code Column */}
        {(activeTab === 'split' || activeTab === 'code') && (
          <div className={`${activeTab === 'split' ? 'lg:col-span-5' : 'w-full'} flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl`}>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300">
              <span className="font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                <span>Generated Arduino C++</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Live Synchronized</span>
            </div>

            <pre className="flex-1 p-3.5 font-mono text-xs text-slate-200 overflow-auto bg-slate-950 max-h-[480px] leading-relaxed selection:bg-cyan-500/30">
              {generatedCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
