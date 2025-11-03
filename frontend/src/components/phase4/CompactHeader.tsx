import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/moving-border';
import { TypewriterEffect } from '../ui/typewriter-effect';
import { cn } from '../../lib/utils';

export default function CompactHeader() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const words = [
    { text: "KPI Dashboard" },
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-lg shadow-xl ${
      theme === 'light' 
        ? 'relative' 
        : 'enhanced-glass-card border-b-2 border-red-500/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(234, 179, 8, 0.2))'
    } : {}}>
      {theme === 'light' && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))'
          }}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-[10px]">
          {/* Logo */}
          <div className="flex items-center">
            <div className={`backdrop-blur-lg px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 ${
              theme === 'light'
                ? 'bg-white/70 border border-gray-200/50 hover:bg-white/80'
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
            <div className={`backdrop-blur-lg px-6 py-3 shadow-lg ${
              theme === 'light'
                ? 'bg-white/50 border border-gray-200/50'
                : 'bg-white/10 border border-white/20'
            }`}>
              <TypewriterEffect
                words={words}
                className={theme === 'light' ? 'text-[#132440] font-bold' : 'text-red-400 font-bold'}
                cursorClassName={theme === 'light' ? 'text-[#132440]' : 'text-red-500'}
              />
            </div>
          </div>

          {/* Right: Back Button */}
          <div className="flex items-center">
            <Button
              onClick={() => navigate('/')}
              borderRadius="0.5rem"
              containerClassName="h-auto w-auto"
              className={cn(
                'px-4 py-2 text-sm font-bold whitespace-nowrap',
                theme === 'light'
                  ? '!bg-white !text-[#FEA519] !border-neutral-200' // Yellow text
                  : 'bg-slate-900 text-white border-slate-800'
              )}
              borderClassName={
                theme === 'light'
                  ? 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]' // Red border
                  : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
              }
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
