import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { 
  IconLogin, 
  IconLogout
} from '@tabler/icons-react';

export default function Header() {
  const location = useLocation();
  const { theme } = useTheme();
  const { dateRange } = useDashboard();
  const { user, isLoading, logout } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (dateRange.from) {
      setCurrentMonth(format(dateRange.from, "MMM''yy"));
    } else {
      setCurrentMonth(format(new Date(), "MMM''yy"));
    }
  }, [dateRange.from]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

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

            {/* Right - Month Badge and User Auth */}
            <div className="flex items-center gap-3">
              {/* Month Badge */}
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

              {/* User Authentication UI */}
              {isLoading ? (
                // Loading state
                <div className={`w-10 h-10 rounded-full animate-pulse ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                }`} />
              ) : !user ? (
                // Sign In Button
                <Link
                  to="/auth"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    theme === 'light'
                      ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm focus:ring-red-500'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20 focus:ring-orange-400'
                  }`}
                  aria-label="Sign in to your account"
                >
                  <IconLogin className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              ) : (
                // User Info Card and Logout Button (Horizontal Layout)
                <div className="flex items-center gap-4">
                  {/* User Info Card */}
                  <div 
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg backdrop-blur-md transition-all hover:shadow-xl ${
                      theme === 'light' 
                        ? 'bg-white/70 border border-white/50' 
                        : 'bg-gray-800/70 border border-gray-700/50'
                    }`}
                  >
                    {/* User Avatar - Smaller */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-transform hover:scale-105 ${
                      theme === 'light'
                        ? 'bg-linear-to-br from-orange-500 to-red-500 text-white shadow-orange-500/25'
                        : 'bg-linear-to-br from-orange-600 to-red-600 text-white shadow-red-500/25'
                    }`} aria-hidden="true">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    
                    {/* User Name and Email */}
                    <div className="flex flex-col min-w-0 max-w-[100px] sm:max-w-[130px]">
                      <p className={`text-sm font-semibold truncate ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {user.name || 'User'}
                      </p>
                      <p className={`text-xs truncate hidden sm:block ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Logout Button - Smaller and Transparent */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-md backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 ${
                      theme === 'light'
                        ? 'bg-white/60 text-red-600 hover:bg-red-500/20 hover:text-red-700 border border-white/40 focus:ring-red-500'
                        : 'bg-gray-800/60 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-gray-700/40 focus:ring-orange-400'
                    }`}
                    aria-label="Sign out"
                  >
                    {isLoggingOut ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    ) : (
                      <IconLogout className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

