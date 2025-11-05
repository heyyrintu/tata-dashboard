import { Button } from './ui/moving-border';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

interface TimeGranularityToggleProps {
  granularity: 'daily' | 'weekly' | 'monthly';
  onGranularityChange: (granularity: 'daily' | 'weekly' | 'monthly') => void;
}

export default function TimeGranularityToggle({ granularity, onGranularityChange }: TimeGranularityToggleProps) {
  const { theme } = useTheme();
  
  return (
    <div className="flex gap-3">
      <Button
        onClick={() => onGranularityChange('daily')}
        borderRadius="0.5rem"
        containerClassName="h-auto w-auto transition-all duration-200"
        className={cn(
          'px-4 py-2 text-sm font-bold whitespace-nowrap transition-all duration-200',
          theme === 'light' 
            ? granularity === 'daily'
              ? '!bg-gradient-to-r !from-[#E01E1F]/0 !to-[#FEA519]/0 !text-white !border-[#E01E1F]'
              : '!bg-white !text-[#FEA519] !border-neutral-200'
            : granularity === 'daily' 
              ? 'bg-gradient-to-r from-[#E01E1F]/0 to-[#FEA519]/0 text-white border-[#E01E1F] scale-105'
              : 'bg-slate-900 text-white border-slate-800 opacity-60'
        )}
        borderClassName={
          theme === 'light'
            ? granularity === 'daily'
              ? 'bg-[radial-gradient(#E01E1F_60%,transparent_40%)]'
              : 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]'
            : granularity === 'daily'
              ? 'bg-[radial-gradient(#0ea5e9_60%,transparent_40%)]'
              : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
        }
      >
        Daily
      </Button>
      <Button
        onClick={() => onGranularityChange('weekly')}
        borderRadius="0.5rem"
        containerClassName="h-auto w-auto transition-all duration-200"
        className={cn(
          'px-4 py-2 text-sm font-bold whitespace-nowrap transition-all duration-200',
          theme === 'light' 
            ? granularity === 'weekly'
              ? '!bg-gradient-to-r !from-[#E01E1F]/0 !to-[#FEA519]/0 !text-white !border-[#E01E1F]'
              : '!bg-white !text-[#FEA519] !border-neutral-200'
            : granularity === 'weekly' 
              ? 'bg-gradient-to-r from-[#E01E1F]/0 to-[#FEA519]/0 text-white border-[#E01E1F] scale-105'
              : 'bg-slate-900 text-white border-slate-800 opacity-60'
        )}
        borderClassName={
          theme === 'light'
            ? granularity === 'weekly'
              ? 'bg-[radial-gradient(#E01E1F_60%,transparent_40%)]'
              : 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]'
            : granularity === 'weekly'
              ? 'bg-[radial-gradient(#0ea5e9_60%,transparent_40%)]'
              : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
        }
      >
        Weekly
      </Button>
      <Button
        onClick={() => onGranularityChange('monthly')}
        borderRadius="0.5rem"
        containerClassName="h-auto w-auto transition-all duration-200"
        className={cn(
          'px-4 py-2 text-sm font-bold whitespace-nowrap transition-all duration-200',
          theme === 'light' 
            ? granularity === 'monthly'
              ? '!bg-gradient-to-r !from-[#E01E1F]/0 !to-[#FEA519]/0 !text-white !border-[#E01E1F]'
              : '!bg-white !text-[#FEA519] !border-neutral-200'
            : granularity === 'monthly' 
              ? 'bg-gradient-to-r from-[#E01E1F]/0 to-[#FEA519]/0 text-white border-[#E01E1F] scale-105'
              : 'bg-slate-900 text-white border-slate-800 opacity-60'
        )}
        borderClassName={
          theme === 'light'
            ? granularity === 'monthly'
              ? 'bg-[radial-gradient(#E01E1F_60%,transparent_40%)]'
              : 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]'
            : granularity === 'monthly'
              ? 'bg-[radial-gradient(#0ea5e9_60%,transparent_40%)]'
              : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
        }
      >
        Monthly
      </Button>
    </div>
  );
}

