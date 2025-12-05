import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getLatestIndentDate } from '../../services/api';
import { formatOrdinalDate } from '../../utils/dateFormatting';

export default function CompactHeader() {
  const { theme } = useTheme();
  const [latestIndentDate, setLatestIndentDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestDate = async () => {
      try {
        const date = await getLatestIndentDate();
        setLatestIndentDate(date);
      } catch (error) {
        console.error('[CompactHeader] Error fetching latest indent date:', error);
      }
    };
    fetchLatestDate();
  }, []);

  const shellClasses =
    theme === 'light'
      ? 'bg-white/85 border-slate-200 text-slate-900'
      : 'bg-slate-950/80 border-white/10 text-white';

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-lg transition-all duration-300 ${shellClasses}`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center gap-3">
          <div className="flex flex-1 items-center gap-2 text-base font-semibold leading-none uppercase tracking-tight">
            <span>DRONA</span>
            <span className={theme === 'light' ? 'text-slate-400' : 'text-slate-600'}>/</span>
            <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-300'}>
              TATA DEF FINANCE
            </span>
          </div>

          {latestIndentDate && (
            <div className="flex flex-shrink-0 items-center gap-2 text-xs font-semibold">
              <span
                className={`hidden sm:flex items-center gap-2 rounded-full border px-3 py-1 ${
                  theme === 'light'
                    ? 'border-emerald-100 bg-white text-emerald-600'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Data up to {formatOrdinalDate(latestIndentDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

