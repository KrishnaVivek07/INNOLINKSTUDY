import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-text)] transition-colors duration-200"
      title="Color Theme: Light / Dark / System (auto)"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 text-xs ${
          theme === 'light'
            ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-xs border border-[var(--border)]'
            : 'hover:text-[var(--foreground)]'
        }`}
        title="Light Mode (White / Light Neutral)"
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden xl:inline text-[11px]">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 text-xs ${
          theme === 'dark'
            ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-xs border border-[var(--border)]'
            : 'hover:text-[var(--foreground)]'
        }`}
        title="Dark Mode (Black / Dark Charcoal)"
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden xl:inline text-[11px]">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 text-xs ${
          theme === 'system'
            ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-xs border border-[var(--border)]'
            : 'hover:text-[var(--foreground)]'
        }`}
        title="System Preference (Automatically follows OS theme)"
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="hidden xl:inline text-[11px]">System</span>
      </button>
    </div>
  );
};
