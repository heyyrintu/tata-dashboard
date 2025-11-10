import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../context/DashboardContext';
import { format } from 'date-fns';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { dateRange } = useDashboard();
  
  // Format the selected month from dateRange (e.g., Jan'25, Mar'24)
  const selectedMonthText = dateRange.from && dateRange.to
    ? format(dateRange.from, "MMM''yy")
    : 'All Months';

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-lg shadow-xl ${
      theme === 'light' 
        ? 'relative' 
        : 'bg-[#0a0e27]/95 border-b-2 border-red-500/30'
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
            <div className={`backdrop-blur-md px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 ${
              theme === 'light'
                ? 'bg-gray-100/80 border border-gray-300'
                : 'bg-white/10 border border-white/20 hover:bg-white/15'
            }`}>
              <img 
                src="https://cdn.dribbble.com/userupload/45564127/file/6c01b78a863edd968c45d2287bcd5854.png?resize=752x470&vertical=center" 
                alt="Drona Logo" 
                className="h-[63px] w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Center: Dashboard Title */}
          <div className="flex-1 flex justify-center">
            <div className={`backdrop-blur-md px-6 py-3 shadow-lg ${
              theme === 'light'
                ? 'bg-gray-100/70 border border-gray-300'
                : 'bg-white/70 border border-white/20'
            }`}>
              <div className={`text-center text-2xl font-bold ${
                theme === 'light' 
                  ? 'bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent'
              }`}>
                TML DEF Dashboard
              </div>
            </div>
          </div>

          {/* Selected Month Display */}
          {location.pathname === '/' && (
            <div className="flex items-center mx-4">
              <div className={`backdrop-blur-md px-4 py-2 shadow-lg ${
                theme === 'light'
                  ? 'bg-gray-100/70 border border-gray-300'
                  : 'bg-white/70 border border-white/20'
              }`}>
                <div className={`text-center text-base font-semibold ${
                  theme === 'light' 
                    ? 'bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent'
                }`}>
                  {selectedMonthText}
                </div>
              </div>
            </div>
          )}

          {/* Right: Navigation Buttons */}
          <div className="flex items-center gap-3">
            {location.pathname === '/' && (
              <button
                onClick={() => navigate('/powerbi')}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600'
                    : 'bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600'
                }`}
                aria-label="Finance Dashboard"
                title="Finance Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 ${
                theme === 'light'
                  ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500'
                  : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

