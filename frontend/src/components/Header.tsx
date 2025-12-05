import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../context/DashboardContext';
import { format } from 'date-fns';

export default function Header() {
  const location = useLocation();
  const { theme } = useTheme();
  const { dateRange } = useDashboard();
  const [currentMonth, setCurrentMonth] = useState<string>('');

  useEffect(() => {
    if (dateRange.from) {
      setCurrentMonth(format(dateRange.from, "MMM''yy"));
    } else {
      setCurrentMonth(format(new Date(), "MMM''yy"));
    }
  }, [dateRange.from]);

  const pageTitle = location.pathname === '/upload' ? 'TML DEF Update' : 'TML DEF Dashboard';

  return (
    <header className="sticky top-0 z-50">
      {/* Main Header with Sidebar Gradient */}
      <div 
        className="py-3 px-4 sm:px-6 backdrop-blur-md border-b-2"
        style={{
          background: theme === 'light' 
            ? 'linear-gradient(to bottom right, rgba(224, 30, 31, 0.15), rgba(254, 165, 25, 0.15))'
            : 'linear-gradient(to bottom right, rgba(224, 30, 31, 0.1), rgba(254, 165, 25, 0.1))',
          borderColor: theme === 'light' ? 'rgba(224, 30, 31, 0.2)' : 'rgba(254, 165, 25, 0.2)'
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Left - DRONA Logo Image */}
            <Link 
              to="/"
              className={`flex items-center justify-center px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md transition-transform hover:scale-105 ${
                theme === 'light'
                  ? 'bg-gray-100/80 border border-gray-300'
                  : 'bg-white/10 border border-white/20 hover:bg-white/15'
              }`}
            >
              <img 
                src="https://cdn.dribbble.com/userupload/45564127/file/6c01b78a863edd968c45d2287bcd5854.png?resize=752x470&vertical=center" 
                alt="Drona Logo" 
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Center - Page Title */}
            <div className="flex-1 flex justify-center">
              <div 
                className="px-10 py-3 rounded-full shadow-md backdrop-blur-md"
                style={{
                  background: theme === 'light' 
                    ? 'rgba(255, 255, 255, 0.85)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: theme === 'light' ? '1px solid rgba(224, 30, 31, 0.15)' : '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <h1 
                  className="text-lg sm:text-xl font-bold tracking-wide"
                  style={{ 
                    color: theme === 'light' ? '#b45309' : '#FEA519',
                  }}
                >
                  {pageTitle}
                </h1>
              </div>
            </div>

            {/* Right - Month Badge (Bigger) */}
            <div 
              className="px-5 py-2.5 rounded-xl text-lg font-bold shadow-lg backdrop-blur-md transition-transform hover:scale-105"
              style={{
                background: theme === 'light' 
                  ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                  : 'linear-gradient(135deg, rgba(254, 165, 25, 0.2) 0%, rgba(224, 30, 31, 0.2) 100%)',
                color: theme === 'light' ? '#92400e' : '#FEA519',
                border: theme === 'light' ? '2px solid #fcd34d' : '2px solid rgba(254, 165, 25, 0.3)'
              }}
            >
              {currentMonth}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

