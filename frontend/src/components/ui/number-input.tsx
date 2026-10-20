import { ChevronDown, ChevronUp } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Number field with the browser's native spinner hidden and replaced by a
// stacked pair of chevron buttons that match the rest of the form styling.
export function NumberInput({
  id,
  value,
  onValueChange,
  min = 0,
  max,
  className,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const step = (delta: number) => {
    let next = (Number(value) || 0) + delta;
    if (next < min) next = min;
    if (max !== undefined && next > max) next = max;
    onValueChange(String(next));
  };

  const arrowClass =
    'flex flex-1 items-center justify-center text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white';

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="pr-8 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <div className="absolute inset-y-px right-px flex w-6 flex-col overflow-hidden rounded-r-[7px] border-l border-input">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increase"
          className={arrowClass}
          disabled={max !== undefined && (Number(value) || 0) >= max}
          onClick={() => step(1)}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrease"
          className={cn(arrowClass, 'border-t border-input')}
          disabled={(Number(value) || 0) <= min}
          onClick={() => step(-1)}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
