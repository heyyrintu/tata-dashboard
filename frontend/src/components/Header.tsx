import { TypewriterEffect } from './ui/typewriter-effect';
import { Button } from './ui/moving-border';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const words = [
    { text: "TML DEF Dashboard" },
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-lg shadow-xl ${
      theme === 'light' 
        ? 'border-b border-gray-200' 
        : 'bg-[#0a0e27]/95 border-b border-blue-950'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(234, 179, 8, 0.2))'
    } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-[10px]">
          {/* Logo */}
          <div className="flex items-center">
            <div className={`backdrop-blur-md px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 ${
              theme === 'light'
                ? 'bg-gray-100/80 border border-gray-300'
                : 'bg-white/10 border border-white/20 hover:bg-white/15'
            }`}>
              <img 
                src="https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center" 
                alt="Drona Logo" 
                className="h-[63px] w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Center: Typewriter Effect */}
          <div className="flex-1 flex justify-center">
            <div className={`backdrop-blur-md px-6 py-3 shadow-lg ${
              theme === 'light'
                ? 'bg-gray-100/50 border border-gray-300'
                : 'bg-white/10 border border-white/20'
            }`}>
              <TypewriterEffect
                words={words}
                className={theme === 'light' ? 'text-[#132440] font-bold' : 'text-amber-50/70 font-bold'}
                cursorClassName={theme === 'light' ? 'text-[#132440]' : 'text-amber-50/70'}
              />
            </div>
          </div>

          {/* Right: Navigation Buttons */}
          <div className="flex items-center gap-3">
            {location.pathname === '/' && (
              <Button
                onClick={() => navigate('/powerbi')}
                borderRadius="0.5rem"
                containerClassName="h-auto w-auto"
                className={cn(
                  'px-4 py-2 text-sm font-bold whitespace-nowrap',
                  theme === 'light' 
                    ? '!bg-white !text-[#FEA519] !border-neutral-200' 
                    : 'bg-slate-900 text-white border-slate-800'
                )}
                borderClassName={
                  theme === 'light'
                    ? 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]'
                    : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
                }
              >
                Power BI View
              </Button>
            )}
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 ${
                theme === 'light'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                  : 'bg-gradient-to-br from-purple-500 to-blue-500'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <span className="text-white text-xl">☀️</span>
              ) : (
                <span className="text-white text-xl">🌙</span>
              )}
            </button>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 ${
              theme === 'light'
                ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                : 'bg-gradient-to-br from-purple-500 to-blue-500'
            }`}>
              <span className="text-white font-semibold">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

