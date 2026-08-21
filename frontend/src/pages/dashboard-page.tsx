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
  Sparkles,
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
import { apiFetch } from '@/lib/api-client';
import {
  API_TO_STATUS,
  formatWeekLabel,
  mapApplicationResponse,
  type DashboardResponseDto,
} from '@/lib/mappers';
import { CATEGORICAL, CHART_INK, STATUS_COLORS } from '@/lib/chart-colors';
import type { ApplicationStatus } from '@/types';

const PIPELINE_STATUSES: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Online Assessment',
  'Interviewing',
  'Final Round',
  'Offer',
  'Rejected',
  'Ghosted',
];

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-white/40">
      <Sparkles className="h-5 w-5 text-sky-400/60" />
      <p className="text-sm">{label}</p>
      <p className="text-xs">AI backend not built yet — coming soon.</p>
    </div>
  );
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<DashboardResponseDto>('/dashboard');
        setDashboard(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading || !dashboard) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Dashboard" description="Your job search at a glance." />
        <div className="py-16 text-center text-sm text-white/40">Loading dashboard...</div>
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
        <StatCard label="Follow-Ups Needed" value={dashboard.followUpsNeeded} icon={MessagesSquare} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Status breakdown</h2>
            <p className="text-sm text-white/50">Applications by current pipeline stage</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusBreakdown} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: CHART_INK.muted, fontSize: 12 }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={110}
                  tick={{ fill: CHART_INK.secondary, fontSize: 12 }}
                  axisLine={{ stroke: CHART_INK.axis }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#111110', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: CHART_INK.primary }}
                  labelStyle={{ color: CHART_INK.primary }}
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

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Weekly application activity</h2>
            <p className="text-sm text-white/50">Applications submitted per week</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyActivity} margin={{ left: -16, right: 16 }}>
                <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                <XAxis dataKey="week" tick={{ fill: CHART_INK.muted, fontSize: 12 }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: CHART_INK.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ stroke: CATEGORICAL[0], strokeWidth: 1 }}
                  contentStyle={{ background: '#111110', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: CHART_INK.primary }}
                  labelStyle={{ color: CHART_INK.primary }}
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
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent applications</h2>
            <Link to="/applications" className="text-xs font-medium text-sky-400 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    {app.jobTitle} · {app.companyName}
                  </div>
                  <div className="text-xs text-white/40">Applied {app.dateApplied}</div>
                </div>
                <StatusBadge status={app.status} className="shrink-0" />
              </div>
            ))}
            {recentApplications.length === 0 && (
              <div className="py-8 text-center text-sm text-white/40">
                No applications yet — add your first one to see it here.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Highest match jobs</h2>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ComingSoon label="Resume match scoring" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex flex-col border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Upcoming follow-ups</h2>
            <p className="text-sm text-white/50">Applications ApplyIQ recommends acting on this week</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ComingSoon label="Follow-up recommendations" />
          </CardContent>
        </Card>

        <Card className="flex flex-col border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Applications needing attention</h2>
            <p className="text-sm text-white/50">Highest ghosting risk right now</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ComingSoon label="Ghosting risk scoring" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
