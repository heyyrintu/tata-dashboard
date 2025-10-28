import { HoverBorderGradient } from './HoverBorderGradient';

interface TimeGranularityToggleProps {
  granularity: 'daily' | 'weekly' | 'monthly';
  onGranularityChange: (granularity: 'daily' | 'weekly' | 'monthly') => void;
}

export default function TimeGranularityToggle({ granularity, onGranularityChange }: TimeGranularityToggleProps) {
  return (
    <div className="flex gap-3">
      <HoverBorderGradient
        onClick={() => onGranularityChange('daily')}
        className={granularity === 'daily' ? 'bg-blue-600' : 'bg-slate-700'}
      >
        Daily
      </HoverBorderGradient>
      <HoverBorderGradient
        onClick={() => onGranularityChange('weekly')}
        className={granularity === 'weekly' ? 'bg-blue-600' : 'bg-slate-700'}
      >
        Weekly
      </HoverBorderGradient>
      <HoverBorderGradient
        onClick={() => onGranularityChange('monthly')}
        className={granularity === 'monthly' ? 'bg-blue-600' : 'bg-slate-700'}
      >
        Monthly
      </HoverBorderGradient>
    </div>
  );
}

