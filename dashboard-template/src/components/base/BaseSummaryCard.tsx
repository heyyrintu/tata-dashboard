/**
 * Base summary card component - configurable metric card
 */

import { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BaseCard } from './BaseCard';
import { LoadingSpinner } from './LoadingSpinner';

export interface BaseSummaryCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: string | ReactNode;
  isLoading?: boolean;
  color?: {
    light: string;
    dark: string;
  };
  formatValue?: (value: string | number) => string | number;
  className?: string;
}

export function BaseSummaryCard({
  label,
  value,
  description,
  icon,
  isLoading = false,
  color,
  formatValue,
  className = '',
}: BaseSummaryCardProps) {
  const { theme } = useTheme();

  const defaultColor = {
    light: 'rgba(224, 30, 31, 0.5)',
    dark: 'rgba(59, 130, 246, 0.3)',
  };

  const cardColor = color || defaultColor;
  const displayValue = formatValue ? formatValue(value) : value;

  const valueGradientClass =
    theme === 'light'
      ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
      : 'text-white';

  return (
    <BaseCard
      borderColor={cardColor.light}
      shadowColor={cardColor.light}
      className={className}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p
            className={`text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-black' : 'text-slate-400'
            }`}
          >
            {label}
          </p>
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <p className={`text-4xl font-bold ${valueGradientClass}`}>
              {displayValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300 ml-4">
            {typeof icon === 'string' ? <span>{icon}</span> : icon}
          </div>
        )}
      </div>
      {description && (
        <p
          className={`text-xs mt-4 relative z-10 ${
            theme === 'light' ? 'text-gray-500' : 'text-slate-500'
          }`}
        >
          {description}
        </p>
      )}
    </BaseCard>
  );
}

