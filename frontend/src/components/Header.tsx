import { TypewriterEffect } from './ui/typewriter-effect';

export default function Header() {
  const words = [
    { text: "TML DEF Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a0e27]/95 backdrop-blur-lg border-b border-blue-950 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-[10px]">
          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
              <img 
                src="https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center" 
                alt="Drona Logo" 
                className="h-[63px] w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Center: Typewriter Effect */}
          <div className="flex-1 flex justify-center">
            <div className="bg-white/10 backdrop-blur-md px-6 py-3 border border-white/20 shadow-lg">
              <TypewriterEffect
                words={words}
                className="text-amber-50/70 font-bold"
                cursorClassName="text-amber-50/70"
              />
            </div>
          </div>

          {/* Right: User Icon */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 cursor-pointer">
              <span className="text-white font-semibold">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

