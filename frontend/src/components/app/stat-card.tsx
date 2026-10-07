import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn('border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] backdrop-blur', className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-white/50">{label}</div>
          <div className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
          {hint && <div className="mt-1 text-xs text-slate-400 dark:text-white/40">{hint}</div>}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
