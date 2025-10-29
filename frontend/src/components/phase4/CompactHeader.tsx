import { useNavigate } from 'react-router-dom';
import { HoverBorderGradient } from '../HoverBorderGradient';
import { TypewriterEffect } from '../ui/typewriter-effect';

export default function CompactHeader() {
  const navigate = useNavigate();
  const words = [
    { text: "KPI Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 enhanced-glass-card border-b-2 border-red-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-[10px]">
          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-white/70 backdrop-blur-lg px-4 py-2 rounded-xl border border-gray-200/50 shadow-lg hover:bg-white/80 transition-all duration-300">
              <img 
                src="https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center" 
                alt="Drona Logo" 
                className="h-[63px] w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Center: Typewriter Effect */}
          <div className="flex-1 flex justify-center">
            <div className="bg-white/70 backdrop-blur-lg px-6 py-3 border border-gray-200/50 shadow-lg">
              <TypewriterEffect
                words={words}
                className="text-red-700 font-bold"
                cursorClassName="text-red-800"
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
