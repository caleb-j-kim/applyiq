import { useMemo } from 'react';
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

import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  missingSkillsFrequency,
  mockApplications,
  sourceConversion,
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

const MATCH_SCORE_BUCKETS = ['0-49', '50-59', '60-69', '70-79', '80-89', '90-100'];

function bucketFor(score: number) {
  if (score < 50) return '0-49';
  if (score < 60) return '50-59';
  if (score < 70) return '60-69';
  if (score < 80) return '70-79';
  if (score < 90) return '80-89';
  return '90-100';
}

const tooltipStyle = {
  background: '#111110',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: CHART_INK.primary,
};

const RADIAN = Math.PI / 180;

function renderPieLabel(props: {
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
      fill={CHART_INK.secondary}
      fontSize={12}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${name} ${Math.round(percent * 100)}%`}
    </text>
  );
}

export function AnalyticsPage() {
  const statusData = useMemo(
    () =>
      PIPELINE_STATUSES.map((status) => ({
        status,
        count: mockApplications.filter((a) => a.status === status).length,
      })).filter((d) => d.count > 0),
    []
  );

  const matchScoreData = useMemo(() => {
    const counts = Object.fromEntries(MATCH_SCORE_BUCKETS.map((b) => [b, 0])) as Record<string, number>;
    mockApplications.forEach((a) => {
      if (typeof a.matchScore === 'number') counts[bucketFor(a.matchScore)] += 1;
    });
    return MATCH_SCORE_BUCKETS.map((bucket) => ({ bucket, count: counts[bucket] }));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" description="Patterns across your entire job search." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Applications by status</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 8, bottom: 8, left: 40, right: 40 }}>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  label={renderPieLabel}
                  labelLine={{ stroke: CHART_INK.axis }}
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
                  formatter={(value) => <span style={{ color: CHART_INK.secondary, fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Weekly applications</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyApplicationActivity} margin={{ left: -16, right: 16 }}>
                <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                <XAxis dataKey="week" tick={{ fill: CHART_INK.muted, fontSize: 12 }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: CHART_INK.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
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

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Resume match score distribution</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={matchScoreData} margin={{ left: -16, right: 16 }}>
                <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                <XAxis dataKey="bucket" tick={{ fill: CHART_INK.muted, fontSize: 12 }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: CHART_INK.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" name="Applications" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Most common missing skills</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={missingSkillsFrequency} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: CHART_INK.muted, fontSize: 12 }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="skill"
                  width={90}
                  tick={{ fill: CHART_INK.secondary, fontSize: 12 }}
                  axisLine={{ stroke: CHART_INK.axis }}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" name="Applications missing this skill" fill={CATEGORICAL[0]} radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur lg:col-span-2">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Response rate by source</h2>
            <p className="text-sm text-white/50">Share of applications from each source that got a response</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sourceConversion} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
                <XAxis
                  type="number"
                  unit="%"
                  tick={{ fill: CHART_INK.muted, fontSize: 12 }}
                  axisLine={{ stroke: CHART_INK.axis }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="source"
                  width={130}
                  tick={{ fill: CHART_INK.secondary, fontSize: 12 }}
                  axisLine={{ stroke: CHART_INK.axis }}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
