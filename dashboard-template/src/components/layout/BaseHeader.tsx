/**
 * Base header component - configurable header with navigation
 */

import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { TypewriterEffect } from '../ui/typewriter-effect';
import { DashboardConfig } from '../../config/dashboard.config';

export interface BaseHeaderProps {
  config: DashboardConfig;
  navigationItems?: Array<{ path: string; label: string; icon?: string }>;
  logo?: string;
  showThemeToggle?: boolean;
  customActions?: ReactNode;
}

export function BaseHeader({
  config,
  navigationItems,
  logo,
  showThemeToggle = true,
  customActions,
}: BaseHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const words = [{ text: config.title }];

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-lg shadow-xl ${
        theme === 'light'
          ? 'relative'
          : 'bg-[#0a0e27]/95 border-b-2 border-red-500/30'
      }`}
      style={
        theme === 'light'
          ? {
              background: `linear-gradient(to right, ${config.branding.primaryColor}20, ${config.branding.secondaryColor}20)`,
            }
          : {}
      }
    >
      {theme === 'light' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(to right, ${config.branding.primaryColor}35, ${config.branding.secondaryColor}35)`,
          }}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-[10px]">
          {/* Logo */}
          {logo && (
            <div className="flex items-center">
              <div
                className={`backdrop-blur-md px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-gray-100/80 border border-gray-300'
                    : 'bg-white/10 border border-white/20 hover:bg-white/15'
                }`}
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="h-[63px] w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Center: Typewriter Effect */}
          <div className="flex-1 flex justify-center">
            <div
              className={`backdrop-blur-md px-6 py-3 shadow-lg ${
                theme === 'light'
                  ? 'bg-gray-100/70 border border-gray-300'
                  : 'bg-white/70 border border-white/20'
              }`}
            >
              <TypewriterEffect
                words={words}
                className={
                  theme === 'light'
                    ? `bg-gradient-to-r from-[${config.branding.primaryColor}] to-[${config.branding.secondaryColor}] bg-clip-text text-transparent font-bold`
                    : `bg-gradient-to-r from-[${config.branding.primaryColor}] to-[${config.branding.secondaryColor}] bg-clip-text text-transparent font-bold`
                }
              />
            </div>
          </div>

          {/* Right: Navigation & Actions */}
          <div className="flex items-center gap-4">
            {navigationItems?.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  location.pathname === item.path
                    ? theme === 'light'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white'
                    : theme === 'light'
                      ? 'text-gray-700 hover:bg-gray-200'
                      : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </button>
            ))}

            {customActions}

            {showThemeToggle && (
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  theme === 'light'
                    ? 'text-gray-700 hover:bg-gray-200'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

