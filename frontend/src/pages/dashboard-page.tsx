import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  Briefcase,
  Ghost,
  MessagesSquare,
  Percent,
  Plus,
  Target,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/app/page-header';
import { StatCard } from '@/components/app/stat-card';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { mockFollowUpRecommendations } from '@/data/mock-data';
import { apiFetch } from '@/lib/api-client';
import { isDemoAccount } from '@/lib/demo-ai';
import { ACTION_STYLE, isSendAction } from '@/lib/follow-up-actions';
import {
  API_TO_STATUS,
  formatWeekLabel,
  mapApplicationResponse,
  mapFollowUpResponse,
  type DashboardResponseDto,
  type FollowUpResponseDto,
} from '@/lib/mappers';
import { cn } from '@/lib/utils';
import { CATEGORICAL, CHART_INK, CHART_INK_LIGHT, CHART_SURFACE, STATUS_COLORS } from '@/lib/chart-colors';
import { useTheme } from '@/context/theme-context';
import { APPLICATION_STATUSES, type FollowUpRecommendation } from '@/types';

const PIPELINE_STATUSES = APPLICATION_STATUSES.filter((s) => s !== 'Withdrawn');

interface TopMatchDto {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  status: string;
  matchScore: number;
}

const DASHBOARD_LIST_SIZE = 5;

function EmptyRow({ children }: { children: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-8 text-center text-sm text-slate-400 dark:text-white/40">{children}</div>
  );
}

export function DashboardPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDemo = isDemoAccount(user?.email);
  const ink = theme === 'dark' ? CHART_INK : CHART_INK_LIGHT;
  const surface = CHART_SURFACE[theme];
  const [dashboard, setDashboard] = useState<DashboardResponseDto | null>(null);
  const [topMatches, setTopMatches] = useState<TopMatchDto[]>([]);
  // Same source as the Follow-Ups page: sample data on the demo account, the decision tree otherwise.
  const [followUps, setFollowUps] = useState<FollowUpRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [data, matchData, followUpData] = await Promise.all([
          apiFetch<DashboardResponseDto>('/dashboard'),
          apiFetch<{ topMatches: TopMatchDto[] }>('/ai/match-analytics'),
          // A follow-ups failure shouldn't take the whole dashboard down with it.
          isDemo
            ? Promise.resolve(mockFollowUpRecommendations)
            : apiFetch<FollowUpResponseDto[]>('/follow-ups')
                .then((list) => list.map(mapFollowUpResponse))
                .catch(() => []),
        ]);
        setDashboard(data);
        setTopMatches(matchData.topMatches);
        setFollowUps(followUpData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isDemo]);

  if (isLoading || !dashboard) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Dashboard" description="Your job search at a glance." />
        <div className="py-16 text-center text-sm text-slate-400 dark:text-white/40">Loading dashboard...</div>
      </div>
    );
  }

  const statusBreakdown = PIPELINE_STATUSES.map((status) => ({
    status,
    count: dashboard.statusBreakdown.find((s) => API_TO_STATUS[s.status] === status)?.count ?? 0,
  }));

  const weeklyActivity = dashboard.weeklyActivity.map((w) => ({
    week: formatWeekLabel(w.weekStart),
    applications: w.applications,
  }));

  const recentApplications = dashboard.recentApplications.map(mapApplicationResponse);

  const upcomingFollowUps = followUps.filter((f) => isSendAction(f.recommendedAction)).slice(0, DASHBOARD_LIST_SIZE);
  // Model recommendations only (user-added ones have no risk score), closed applications left out.
  const atRisk = followUps
    .filter((f) => !f.addedByUser && f.status !== 'Rejected' && f.status !== 'Withdrawn')
    .sort((a, b) => b.ghostingRiskScore - a.ghostingRiskScore)
    .slice(0, DASHBOARD_LIST_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Your job search at a glance."
        actions={
          <Button
            render={<Link to="/applications" />}
            nativeButton={false}
            className="gap-2 bg-sky-500 text-white hover:bg-sky-400"
          >
            <Plus className="h-4 w-4" />
            Add application
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Applications" value={dashboard.total} icon={Briefcase} />
        <StatCard label="Active Applications" value={dashboard.active} icon={Target} />
        <StatCard label="With Referrals" value={dashboard.withReferral} icon={Users} />
        <StatCard label="Without Referrals" value={dashboard.withoutReferral} icon={Users} />
        <StatCard label="Referral Response Rate" value={`${dashboard.referralResponseRate}%`} icon={Percent} />
        <StatCard label="Interview Rate (Referral)" value={`${dashboard.interviewRateWithReferral}%`} icon={Percent} />
        <StatCard label="Interview Rate (No Referral)" value={`${dashboard.interviewRateWithoutReferral}%`} icon={Percent} />
        <StatCard label="Interviews" value={dashboard.interviews} icon={MessagesSquare} />
        <StatCard label="Offers" value={dashboard.offers} icon={Award} />
        <StatCard label="Rejected" value={dashboard.rejected} icon={XCircle} />
        <StatCard label="Likely Ghosted" value={dashboard.ghosted} icon={Ghost} />
        <StatCard label="Follow-Ups Needed" value={followUps.length} icon={MessagesSquare} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Status breakdown</h2>
            <p className="text-sm text-slate-500 dark:text-white/50">Applications by current pipeline stage</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusBreakdown} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={ink.grid} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: ink.muted, fontSize: 12 }} axisLine={{ stroke: ink.axis }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={110}
                  tick={{ fill: ink.secondary, fontSize: 12 }}
                  axisLine={{ stroke: ink.axis }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: surface.cursor }}
                  contentStyle={{ background: surface.tooltipBg, border: `1px solid ${surface.tooltipBorder}`, borderRadius: 8, color: ink.primary }}
                  labelStyle={{ color: ink.primary }}
                />
                <Bar dataKey="count" name="Applications" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Weekly application activity</h2>
            <p className="text-sm text-slate-500 dark:text-white/50">Applications submitted per week</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyActivity} margin={{ left: -16, right: 16 }}>
                <CartesianGrid vertical={false} stroke={ink.grid} />
                <XAxis dataKey="week" tick={{ fill: ink.muted, fontSize: 12 }} axisLine={{ stroke: ink.axis }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: ink.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ stroke: CATEGORICAL[0], strokeWidth: 1 }}
                  contentStyle={{ background: surface.tooltipBg, border: `1px solid ${surface.tooltipBorder}`, borderRadius: 8, color: ink.primary }}
                  labelStyle={{ color: ink.primary }}
                />
                <Line
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke={CATEGORICAL[0]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: CATEGORICAL[0], strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent applications</h2>
            <Link to="/applications" className="text-xs font-medium text-sky-400 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {app.jobTitle} · {app.companyName}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-white/40">Applied {app.dateApplied}</div>
                </div>
                <StatusBadge status={app.status} className="shrink-0" />
              </div>
            ))}
            {recentApplications.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400 dark:text-white/40">
                No applications yet — add your first one to see it here.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Highest match jobs</h2>
            <Link to="/resume-match" className="text-xs font-medium text-sky-400 hover:underline">
              Run a match
            </Link>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-1">
            {topMatches.map((match) => (
              <div key={match.applicationId} className="flex flex-col gap-1.5 rounded-lg px-2 py-2.5 hover:bg-slate-100 dark:hover:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900 dark:text-white">{match.jobTitle}</div>
                    <div className="truncate text-xs text-slate-400 dark:text-white/40">{match.companyName}</div>
                  </div>
                  <StatusBadge status={API_TO_STATUS[match.status] ?? 'Saved'} className="shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${match.matchScore}%` }} />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs text-slate-500 tabular-nums dark:text-white/60">
                    {match.matchScore}%
                  </span>
                </div>
              </div>
            ))}
            {topMatches.length === 0 && (
              <div className="flex flex-1 items-center justify-center py-8 text-center text-sm text-slate-400 dark:text-white/40">
                No match scores yet — run Resume Match on a saved application.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming follow-ups</h2>
              <p className="text-sm text-slate-500 dark:text-white/50">Applications ApplyIQ recommends following up on now</p>
            </div>
            <Link to="/follow-ups" className="shrink-0 text-xs font-medium text-sky-400 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-1">
            {upcomingFollowUps.map((f) => (
              <Link
                key={f.id}
                to="/follow-ups"
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {f.jobTitle} · {f.companyName}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-white/40">Applied {f.daysSinceApplied} days ago</div>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', ACTION_STYLE[f.recommendedAction])}>
                  {f.recommendedAction}
                </span>
              </Link>
            ))}
            {upcomingFollowUps.length === 0 && <EmptyRow>No follow-ups to send right now.</EmptyRow>}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Applications needing attention</h2>
            <p className="text-sm text-slate-500 dark:text-white/50">Highest ghosting risk right now</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-1">
            {atRisk.map((f) => {
              const risk = Math.round(f.ghostingRiskScore * 100);
              return (
                <Link
                  key={f.id}
                  to="/follow-ups"
                  className="flex flex-col gap-1.5 rounded-lg px-2 py-2.5 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-white">{f.jobTitle}</div>
                      <div className="truncate text-xs text-slate-400 dark:text-white/40">
                        {f.companyName} · {f.recommendedAction}
                      </div>
                    </div>
                    <StatusBadge status={f.status} className="shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
                      role="meter"
                      aria-label={`Ghosting risk for ${f.companyName}`}
                      aria-valuenow={risk}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={cn('h-full rounded-full', risk >= 70 ? 'bg-rose-400' : risk >= 40 ? 'bg-amber-400' : 'bg-sky-400')}
                        style={{ width: `${risk}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-xs text-slate-500 tabular-nums dark:text-white/60">{risk}%</span>
                  </div>
                </Link>
              );
            })}
            {atRisk.length === 0 && <EmptyRow>Nothing at risk — every active application is on track.</EmptyRow>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
