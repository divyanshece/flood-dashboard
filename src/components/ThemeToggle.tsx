'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full p-1 transition-all duration-300 hover:scale-105"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
          : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        boxShadow: theme === 'dark'
          ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
          : 'inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)',
      }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Track decoration */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {/* Stars for dark mode */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: theme === 'dark' ? 1 : 0 }}
        >
          <div className="absolute top-1.5 left-2 w-1 h-1 bg-white rounded-full opacity-60" />
          <div className="absolute top-3 left-4 w-0.5 h-0.5 bg-white rounded-full opacity-40" />
          <div className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white rounded-full opacity-50" />
        </div>

        {/* Clouds for light mode */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: theme === 'light' ? 1 : 0 }}
        >
          <div className="absolute top-1 right-2 w-3 h-1.5 bg-white rounded-full opacity-60" />
          <div className="absolute bottom-1.5 right-4 w-2 h-1 bg-white rounded-full opacity-40" />
        </div>
      </div>

      {/* Toggle knob */}
      <div
        className="relative w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center"
        style={{
          transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(0)',
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
            : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          boxShadow: theme === 'dark'
            ? '0 2px 8px rgba(96, 165, 250, 0.5)'
            : '0 2px 8px rgba(245, 158, 11, 0.5)',
        }}
      >
        {/* Sun Icon */}
        <svg
          className="absolute w-4 h-4 transition-all duration-300"
          style={{
            color: 'white',
            opacity: theme === 'light' ? 1 : 0,
            transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-5.07l-1.41 1.41M8.34 15.66l-1.41 1.41m10.14 0l-1.41-1.41M8.34 8.34L6.93 6.93" />
        </svg>

        {/* Moon Icon */}
        <svg
          className="absolute w-3.5 h-3.5 transition-all duration-300"
          style={{
            color: 'white',
            opacity: theme === 'dark' ? 1 : 0,
            transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
          }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </div>
    </button>
  );
}
