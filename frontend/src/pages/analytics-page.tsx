import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { apiFetch } from '@/lib/api-client';
import {
  API_TO_STATUS,
  formatWeekLabel,
  mapApplicationResponse,
  type DashboardResponseDto,
  type JobApplicationResponseDto,
} from '@/lib/mappers';
import { computeSourceConversion } from '@/lib/analytics';
import { CATEGORICAL, CHART_INK, CHART_INK_LIGHT, CHART_SURFACE, STATUS_COLORS } from '@/lib/chart-colors';
import { useTheme } from '@/context/theme-context';

const RADIAN = Math.PI / 180;

function renderPieLabel(secondaryInk: string) {
  return function PieLabel(props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    outerRadius?: number;
    percent?: number;
    name?: string;
  }) {
    const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, name = '' } = props;
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={secondaryInk}
        fontSize={12}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${name} ${Math.round(percent * 100)}%`}
      </text>
    );
  };
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-slate-400 dark:text-white/40">
      <Sparkles className="h-5 w-5 text-sky-400/60" />
      <p className="text-sm">{label}</p>
      <p className="text-xs">AI backend not built yet — coming soon.</p>
    </div>
  );
}

export function AnalyticsPage() {
  const { theme } = useTheme();
  const ink = theme === 'dark' ? CHART_INK : CHART_INK_LIGHT;
  const surface = CHART_SURFACE[theme];
  const tooltipStyle = {
    background: surface.tooltipBg,
    border: `1px solid ${surface.tooltipBorder}`,
    borderRadius: 8,
    color: ink.primary,
  };
  const [dashboard, setDashboard] = useState<DashboardResponseDto | null>(null);
  const [applications, setApplications] = useState<JobApplicationResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashboardData, applicationsData] = await Promise.all([
          apiFetch<DashboardResponseDto>('/dashboard'),
          apiFetch<JobApplicationResponseDto[]>('/applications'),
        ]);
        setDashboard(dashboardData);
        setApplications(applicationsData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const statusData = useMemo(
    () =>
      (dashboard?.statusBreakdown ?? [])
        .map((entry) => ({ status: API_TO_STATUS[entry.status], count: entry.count }))
        .filter((d) => d.count > 0),
    [dashboard]
  );

  const weeklyActivity = useMemo(
    () => (dashboard?.weeklyActivity ?? []).map((w) => ({ week: formatWeekLabel(w.weekStart), applications: w.applications })),
    [dashboard]
  );

  const sourceConversion = useMemo(
    () => computeSourceConversion(applications.map(mapApplicationResponse)),
    [applications]
  );

  if (isLoading || !dashboard) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Analytics" description="Patterns across your entire job search." />
        <div className="py-16 text-center text-sm text-slate-400 dark:text-white/40">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" description="Patterns across your entire job search." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Applications by status</h2>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400 dark:text-white/40">No applications yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart margin={{ top: 8, bottom: 8, left: 40, right: 40 }}>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    label={renderPieLabel(ink.secondary)}
                    labelLine={{ stroke: ink.axis }}
                    isAnimationActive={false}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} stroke="#000" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    formatter={(value) => <span style={{ color: ink.secondary, fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Weekly applications</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyActivity} margin={{ left: -16, right: 16 }}>
                <CartesianGrid vertical={false} stroke={ink.grid} />
                <XAxis dataKey="week" tick={{ fill: ink.muted, fontSize: 12 }} axisLine={{ stroke: ink.axis }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: ink.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CATEGORICAL[0], strokeWidth: 1 }} />
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

        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Resume match score distribution</h2>
          </CardHeader>
          <CardContent>
            <ComingSoon label="Resume match scoring" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Most common missing skills</h2>
          </CardHeader>
          <CardContent>
            <ComingSoon label="Resume match scoring" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] backdrop-blur lg:col-span-2">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Response rate by source</h2>
            <p className="text-sm text-slate-500 dark:text-white/50">Share of applications from each source that got a response</p>
          </CardHeader>
          <CardContent>
            {sourceConversion.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400 dark:text-white/40">No applications yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sourceConversion} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid horizontal={false} stroke={ink.grid} />
                  <XAxis
                    type="number"
                    unit="%"
                    tick={{ fill: ink.muted, fontSize: 12 }}
                    axisLine={{ stroke: ink.axis }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="source"
                    width={130}
                    tick={{ fill: ink.secondary, fontSize: 12 }}
                    axisLine={{ stroke: ink.axis }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    formatter={(value) => [`${value}%`, 'Response rate']}
                  />
                  <Bar dataKey="responseRate" name="Response rate" fill={CATEGORICAL[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
