import React, { useState } from 'react';
import { FolderOpen, FileCode, AlertTriangle, CheckCircle, X, Archive } from 'lucide-react';
import JSZip from 'jszip';

interface CodeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCode: (code: string, filename: string) => void;
  currentCode: string;
}

export const CodeImportModal: React.FC<CodeImportModalProps> = ({
  isOpen,
  onClose,
  onImportCode,
  currentCode,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setLoading(true);

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.zip')) {
        // Unpack zip file
        const zip = await JSZip.loadAsync(file);
        let foundCode = '';
        let foundName = '';

        // Search for relevant source file (.ino, .c, .cpp, .py, .java)
        const entries = Object.keys(zip.files);
        const codeEntry = entries.find((path) => {
          const lower = path.toLowerCase();
          return (
            !lower.startsWith('__macosx') &&
            !lower.startsWith('.') &&
            (lower.endsWith('.ino') ||
              lower.endsWith('.c') ||
              lower.endsWith('.cpp') ||
              lower.endsWith('.py') ||
              lower.endsWith('.java') ||
              lower.endsWith('.h'))
          );
        });

        if (codeEntry) {
          foundCode = await zip.files[codeEntry].async('string');
          foundName = codeEntry;
        } else {
          throw new Error('No valid .ino, .c, .cpp, .py, or .java source code found inside ZIP archive.');
        }

        setPreviewContent(foundCode);
      } else {
        // Read text file directly
        const text = await file.text();
        setPreviewContent(text);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to read selected file.');
      setPreviewContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!previewContent || !selectedFile) return;
    onImportCode(previewContent, selectedFile.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Open / Import Code from Device</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Picker */}
        <div className="space-y-2">
          <label className="text-xs text-slate-300 font-medium block">
            Select a source file or multi-file ZIP archive:
          </label>
          <input
            type="file"
            accept=".ino,.c,.cpp,.h,.hpp,.py,.java,.zip"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 file:cursor-pointer border border-slate-700 rounded-lg p-1.5 bg-slate-950"
          />
          <p className="text-[11px] text-slate-400">
            Supported formats: <span className="font-mono text-cyan-300">.ino, .c, .cpp, .h, .hpp, .py, .java, .zip</span>
          </p>
        </div>

        {/* Warning if current editor has code */}
        {currentCode.trim().length > 30 && selectedFile && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="block font-semibold">Warning: Existing Editor Code</strong>
              <span>
                Importing will replace the code currently in your editor. Save your existing sketch if you want to keep it.
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Code Preview */}
        {previewContent && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>File: {selectedFile?.name} ({previewContent.length} chars)</span>
              <span>Lines: {previewContent.split('\n').length}</span>
            </div>
            <div className="h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-cyan-200 select-text">
              <pre className="whitespace-pre-wrap">{previewContent.slice(0, 5000)}</pre>
              {previewContent.length > 5000 && (
                <div className="text-slate-500 italic mt-2">... (truncated preview)</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!previewContent || loading}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            Import into Editor
          </button>
        </div>
      </div>
    </div>
  );
};
