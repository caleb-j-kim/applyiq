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

import { PageHeader } from '@/components/app/page-header';
import { StatCard } from '@/components/app/stat-card';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  computeDashboardSummary,
  mockApplications,
  mockFollowUpRecommendations,
  weeklyApplicationActivity,
} from '@/data/mock-data';
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

export function DashboardPage() {
  const summary = computeDashboardSummary(mockApplications);

  const statusBreakdown = PIPELINE_STATUSES.map((status) => ({
    status,
    count: mockApplications.filter((a) => a.status === status).length,
  }));

  const recentApplications = [...mockApplications]
    .sort((a, b) => (a.dateApplied < b.dateApplied ? 1 : -1))
    .slice(0, 5);

  const highestMatch = [...mockApplications]
    .filter((a) => typeof a.matchScore === 'number')
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 4);

  const upcomingFollowUps = mockFollowUpRecommendations.filter((r) =>
    ['Send first follow-up', 'Send final follow-up'].includes(r.recommendedAction)
  );

  const needingAttention = mockFollowUpRecommendations.filter(
    (r) => r.recommendedAction === 'Mark as likely ghosted' || r.ghostingRiskScore >= 0.5
  );

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
        <StatCard label="Total Applications" value={summary.total} icon={Briefcase} />
        <StatCard label="Active Applications" value={summary.active} icon={Target} />
        <StatCard label="With Referrals" value={summary.withReferral} icon={Users} />
        <StatCard label="Without Referrals" value={summary.withoutReferral} icon={Users} />
        <StatCard label="Referral Response Rate" value={`${summary.referralResponseRate}%`} icon={Percent} />
        <StatCard label="Interview Rate (Referral)" value={`${summary.interviewRateWithReferral}%`} icon={Percent} />
        <StatCard label="Interview Rate (No Referral)" value={`${summary.interviewRateWithoutReferral}%`} icon={Percent} />
        <StatCard label="Interviews" value={summary.interviews} icon={MessagesSquare} />
        <StatCard label="Offers" value={summary.offers} icon={Award} />
        <StatCard label="Rejected" value={summary.rejected} icon={XCircle} />
        <StatCard label="Likely Ghosted" value={summary.ghosted} icon={Ghost} />
        <StatCard label="Follow-Ups Needed" value={summary.followUpsNeeded} icon={MessagesSquare} />
        <StatCard label="Avg Resume Match Score" value={`${summary.avgMatchScore}%`} icon={Target} />
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
              <LineChart data={weeklyApplicationActivity} margin={{ left: -16, right: 16 }}>
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
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Highest match jobs</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {highestMatch.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{app.jobTitle}</div>
                  <div className="truncate text-xs text-white/40">{app.companyName}</div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-sky-400">{app.matchScore}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Upcoming follow-ups</h2>
            <p className="text-sm text-white/50">Applications ApplyIQ recommends acting on this week</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcomingFollowUps.map((rec) => (
              <div key={rec.applicationId} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {rec.jobTitle} · {rec.companyName}
                  </span>
                  <span className="text-xs font-medium text-sky-400">{rec.recommendedAction}</span>
                </div>
                <p className="mt-1 text-xs text-white/50">{rec.reason}</p>
              </div>
            ))}
            <Button
              render={<Link to="/follow-ups" />}
              nativeButton={false}
              variant="outline"
              className="mt-1 border-white/15 bg-transparent text-white/80 hover:bg-white/10"
            >
              View all follow-ups
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Applications needing attention</h2>
            <p className="text-sm text-white/50">Highest ghosting risk right now</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {needingAttention.map((rec) => (
              <div key={rec.applicationId} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    {rec.jobTitle} · {rec.companyName}
                  </div>
                  <div className="text-xs text-white/40">{rec.daysSinceApplied} days since applied</div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-rose-400">
                  {Math.round(rec.ghostingRiskScore * 100)}% risk
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
