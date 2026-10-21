import { CheckCircle2, Circle, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// One of the two large selectable cards at the top of Resume Match and Interview Prep.
export function ModeOption({
  selected,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors',
        selected
          ? 'border-sky-400 bg-sky-500/10'
          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', selected ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-500/10 text-sky-400')}>
          <Icon className="h-4 w-4" />
        </div>
        {selected ? (
          <CheckCircle2 className="h-5 w-5 text-sky-400" />
        ) : (
          <Circle className="h-5 w-5 text-slate-300 dark:text-white/15" />
        )}
      </div>
      <div>
        <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
        <p className="mt-1 text-sm text-slate-500 dark:text-white/50">{description}</p>
      </div>
    </button>
  );
}
