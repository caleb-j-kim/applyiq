import { useState } from 'react';
import { Archive, Check, Ghost, Send } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockFollowUpRecommendations } from '@/data/mock-data';
import type { RecommendedAction } from '@/types';
import { cn } from '@/lib/utils';

const ACTION_ICON: Record<RecommendedAction, typeof Send> = {
  'Send first follow-up': Send,
  'Send final follow-up': Send,
  'Wait longer': Check,
  'Mark as likely ghosted': Ghost,
  'Move to rejected': Archive,
  'Archive application': Archive,
};

const ACTION_STYLE: Record<RecommendedAction, string> = {
  'Send first follow-up': 'text-sky-400 bg-sky-500/10',
  'Send final follow-up': 'text-amber-400 bg-amber-500/10',
  'Wait longer': 'text-white/60 bg-white/10',
  'Mark as likely ghosted': 'text-rose-400 bg-rose-500/10',
  'Move to rejected': 'text-rose-400 bg-rose-500/10',
  'Archive application': 'text-white/50 bg-white/10',
};

export function FollowUpsPage() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const recommendations = mockFollowUpRecommendations.filter((r) => !dismissed.has(r.applicationId));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Follow-Up Recommendations"
        description="Applications that may need action, ranked by ApplyIQ's ghosting risk model."
      />

      {recommendations.length === 0 && (
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardContent className="py-16 text-center text-sm text-white/40">
            You're all caught up — no follow-ups needed right now.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {recommendations.map((rec) => {
          const Icon = ACTION_ICON[rec.recommendedAction];
          return (
            <Card key={rec.applicationId} className="border-white/10 bg-white/[0.03] backdrop-blur">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', ACTION_STYLE[rec.recommendedAction])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{rec.companyName}</span>
                      <span className="text-white/40">·</span>
                      <span className="text-white/70">{rec.jobTitle}</span>
                      <StatusBadge status={rec.status} />
                    </div>
                    <p className="mt-1 text-sm text-white/60">{rec.reason}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/40">
                      <span>Days since applied: {rec.daysSinceApplied}</span>
                      <span>Ghosting risk: {Math.round(rec.ghostingRiskScore * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', ACTION_STYLE[rec.recommendedAction])}>
                    {rec.recommendedAction}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white/70 hover:bg-white/10"
                    onClick={() => setDismissed((prev) => new Set(prev).add(rec.applicationId))}
                  >
                    Mark as done
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
