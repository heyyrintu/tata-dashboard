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
        containerClassName="h-auto w-auto"
        className={cn(
          'px-4 py-2 text-sm font-bold whitespace-nowrap',
          theme === 'light' 
            ? '!bg-white !text-[#FEA519] !border-neutral-200' 
            : granularity === 'daily' 
              ? 'bg-blue-600 text-white border-slate-800' 
              : 'bg-slate-900 text-white border-slate-800'
        )}
        borderClassName={
          theme === 'light'
            ? 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]'
            : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
        }
      >
        Daily
      </Button>
      <Button
        onClick={() => onGranularityChange('weekly')}
        borderRadius="0.5rem"
        containerClassName="h-auto w-auto"
        className={cn(
          'px-4 py-2 text-sm font-bold whitespace-nowrap',
          theme === 'light' 
            ? '!bg-white !text-[#FEA519] !border-neutral-200' 
            : granularity === 'weekly' 
              ? 'bg-blue-600 text-white border-slate-800' 
              : 'bg-slate-900 text-white border-slate-800'
        )}
        borderClassName={
          theme === 'light'
            ? 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]'
            : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
        }
      >
        Weekly
      </Button>
      <Button
        onClick={() => onGranularityChange('monthly')}
        borderRadius="0.5rem"
        containerClassName="h-auto w-auto"
        className={cn(
          'px-4 py-2 text-sm font-bold whitespace-nowrap',
          theme === 'light' 
            ? '!bg-white !text-[#FEA519] !border-neutral-200' 
            : granularity === 'monthly' 
              ? 'bg-blue-600 text-white border-slate-800' 
              : 'bg-slate-900 text-white border-slate-800'
        )}
        borderClassName={
          theme === 'light'
            ? 'bg-[radial-gradient(#E01E1F_40%,transparent_60%)]'
            : 'bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]'
        }
      >
        Monthly
      </Button>
    </div>
  );
}

