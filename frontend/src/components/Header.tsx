import { LampContainer } from "./ui/lamp";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <LampContainer className="!h-[120px] !pb-0">
        <div className="relative z-50 w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
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

            {/* Right: User Icon */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 cursor-pointer">
                <span className="text-white font-semibold">U</span>
              </div>
            </div>
          </div>
        </div>
      </LampContainer>
    </header>
  );
}

