import type { ApplicationStatus } from '@/types';
import { STATUS_COLORS } from '@/lib/chart-colors';
import { cn } from '@/lib/utils';

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const color = STATUS_COLORS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-white/80',
        className
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}
