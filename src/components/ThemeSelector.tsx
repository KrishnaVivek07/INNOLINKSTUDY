import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center p-0.5 rounded-lg border border-slate-800 bg-slate-900/90 text-slate-400"
      title="Customize Theme: Light / Dark / System"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
          theme === 'light'
            ? 'bg-white text-slate-900 shadow-sm font-semibold'
            : 'hover:text-slate-200'
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden xl:inline text-[10px]">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
          theme === 'dark'
            ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
            : 'hover:text-slate-200'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden xl:inline text-[10px]">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
          theme === 'system'
            ? 'bg-cyan-600/20 text-cyan-300 shadow-sm font-semibold border border-cyan-500/30'
            : 'hover:text-slate-200'
        }`}
        title="System (Auto)"
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="hidden xl:inline text-[10px]">System</span>
      </button>
    </div>
  );
};
