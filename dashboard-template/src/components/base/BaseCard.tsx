/**
 * Base card component - reusable card wrapper with glassmorphism effect
 */

import { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface BaseCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  borderColor?: string;
  shadowColor?: string;
}

export function BaseCard({
  children,
  className = '',
  onClick,
  hover = true,
  padding = 'md',
  borderColor,
  shadowColor,
}: BaseCardProps) {
  const { theme } = useTheme();

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover
    ? 'transition-all duration-300 transform hover:-translate-y-1'
    : '';

  const cardStyle =
    theme === 'light'
      ? {
          boxShadow: shadowColor
            ? `0 25px 50px -12px ${shadowColor}`
            : '0 25px 50px -12px rgba(224, 30, 31, 0.25)',
          border: borderColor
            ? `1px solid ${borderColor}`
            : '1px solid rgba(224, 30, 31, 0.5)',
        }
      : {};

  return (
    <div
      className={`glass-card rounded-2xl ${paddingClasses[padding]} ${hoverClasses} relative overflow-hidden group ${
        theme === 'light'
          ? 'shadow-2xl'
          : 'hover:shadow-2xl hover:shadow-blue-900/30 border border-blue-900/30'
      } ${className}`}
      style={cardStyle}
      onClick={onClick}
    >
      {theme === 'light' && (
        <div
          className="absolute inset-0 opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(to bottom right, ${borderColor || 'rgba(224, 30, 31, 0.1)'}, ${borderColor || 'rgba(224, 30, 31, 0.1)'})`,
          }}
        ></div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

