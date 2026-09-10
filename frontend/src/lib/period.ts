/**
 * The dashboard opens on the last complete calendar month, matching the
 * monthly MIS review it is read alongside. The current month is deliberately
 * excluded - a part-month always looks like a collapse in volume and a jump
 * in "pending", because orders raised this week have not shipped yet.
 */

export interface Period {
  from: string;
  to: string;
  label: string;
}

const iso = (d: Date): string => d.toISOString().slice(0, 10);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The calendar month containing `date`, as a closed range. */
export function monthOf(date: Date): Period {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return {
    from: iso(new Date(Date.UTC(y, m, 1))),
    to: iso(new Date(Date.UTC(y, m + 1, 0))),
    label: `${MONTHS[m]} ${y}`,
  };
}

/** Last complete calendar month relative to `today` (defaults to now). */
export function lastFullMonth(today: Date = new Date()): Period {
  return monthOf(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)));
}

/**
 * The period the dashboard should open on.
 *
 * Normally last month. If the data stops before then - an import that has not
 * been refreshed, or a demo database - that window would open empty, so fall
 * back to the month holding the newest LR date instead of showing nothing.
 */
export function defaultPeriod(latestDataDate: string | null, today: Date = new Date()): Period {
  const preferred = lastFullMonth(today);
  if (!latestDataDate) return preferred;
  if (latestDataDate >= preferred.from) return preferred;
  return monthOf(new Date(`${latestDataDate}T00:00:00Z`));
}
