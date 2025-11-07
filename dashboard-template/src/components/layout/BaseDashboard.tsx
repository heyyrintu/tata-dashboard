/**
 * Base dashboard layout component
 * Provides the main layout structure with background and header
 */

import { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BackgroundBeams } from '../ui/background-beams';
import { DashboardConfig } from '../../config/dashboard.config';
import { BaseHeader, BaseHeaderProps } from './BaseHeader';

export interface BaseDashboardProps {
  config: DashboardConfig;
  children: ReactNode;
  headerProps?: Partial<BaseHeaderProps>;
  showBackgroundBeams?: boolean;
  className?: string;
}

export function BaseDashboard({
  config,
  children,
  headerProps,
  showBackgroundBeams = true,
  className = '',
}: BaseDashboardProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen relative ${
        theme === 'light'
          ? 'bg-[#F1F1F1]'
          : 'bg-gradient-to-b from-[#0a0e27] to-[#08101e]'
      } ${className}`}
    >
      {/* Background Beams Effect - Only for dark theme */}
      {showBackgroundBeams && theme === 'dark' && (
        <div className="absolute inset-0 overflow-hidden">
          <BackgroundBeams className="pointer-events-none" />
        </div>
      )}

      {/* Header */}
      <div className="relative z-50">
        <BaseHeader config={config} {...headerProps} />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

