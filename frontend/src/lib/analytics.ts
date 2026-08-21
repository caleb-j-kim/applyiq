import type { ApplicationStatus, JobApplication } from '@/types';

const NO_RESPONSE_STATUSES = new Set<ApplicationStatus>(['Saved', 'Applied']);

export function computeSourceConversion(applications: JobApplication[]): { source: string; responseRate: number }[] {
  const bySource = new Map<string, { total: number; responded: number }>();

  for (const app of applications) {
    const entry = bySource.get(app.source) ?? { total: 0, responded: 0 };
    entry.total += 1;
    if (!NO_RESPONSE_STATUSES.has(app.status)) entry.responded += 1;
    bySource.set(app.source, entry);
  }

  return Array.from(bySource.entries())
    .map(([source, { total, responded }]) => ({
      source,
      responseRate: total ? Math.round((responded / total) * 100) : 0,
    }))
    .sort((a, b) => b.responseRate - a.responseRate);
}
