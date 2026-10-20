import type { CSSProperties } from 'react';
import { AlertTriangle, CheckCircle2, OctagonAlert, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ScoreTier = 'good' | 'warning' | 'critical';

export function tierForScore(score: number): ScoreTier {
  if (score >= 75) return 'good';
  if (score >= 40) return 'warning';
  return 'critical';
}

const TIER_STYLES: Record<ScoreTier, { ring: string; track: string; text: string; icon: LucideIcon; label: string }> = {
  good: { ring: '#10b981', track: 'rgba(16,185,129,0.16)', text: 'text-emerald-400', icon: CheckCircle2, label: 'Looks Great!' },
  warning: { ring: '#f59e0b', track: 'rgba(245,158,11,0.16)', text: 'text-amber-400', icon: AlertTriangle, label: 'Needs Work.' },
  critical: { ring: '#f43f5e', track: 'rgba(244,63,94,0.16)', text: 'text-rose-400', icon: OctagonAlert, label: 'High Risk' },
};

export function ScoreMeter({
  score,
  found,
  total,
  size = 132,
  className,
}: {
  score: number;
  found: number;
  total: number;
  size?: number;
  className?: string;
}) {
  const tier = tierForScore(score);
  const style = TIER_STYLES[tier];
  const Icon = style.icon;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={style.track} strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={style.ring}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="motion-safe:animate-ring-sweep"
            style={{ '--ring-from': circumference } as CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{score}%</span>
          <span className="text-xs text-slate-500 dark:text-white/50">
            {found}/{total} found
          </span>
        </div>
      </div>
      <div className={cn('flex items-center gap-1.5 text-sm font-semibold', style.text)}>
        <Icon className="h-4 w-4" />
        {style.label}
      </div>
    </div>
  );
}
