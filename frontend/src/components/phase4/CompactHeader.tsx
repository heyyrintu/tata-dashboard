import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { HoverBorderGradient } from '../HoverBorderGradient';
import { TypewriterEffect } from '../ui/typewriter-effect';

export default function CompactHeader() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const words = [
    { text: "KPI Dashboard" },
  ];

  return (
    <header className={`sticky top-0 z-50 ${
      theme === 'light' 
        ? 'border-b-2 border-red-500/20' 
        : 'enhanced-glass-card border-b-2 border-red-500/30'
    }`} style={theme === 'light' ? {
      background: 'linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(234, 179, 8, 0.2))'
    } : {}}>
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
            <HoverBorderGradient
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-red-500 to-yellow-500 text-white px-4 py-2 text-sm font-medium"
            >
              Back to Dashboard
            </HoverBorderGradient>
          </div>
        </div>
      </div>
    </header>
  );
}
