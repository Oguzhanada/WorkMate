'use client';

import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Admin design tokens (same as AdminDashboard.tsx) ─────────────────────────
const T = {
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  cardRadius: '14px',
  cardShadow: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  emerald: '#169B62',
  navy: '#1B2A4A',
  violet: '#7c3aed',
  amber: '#d97706',
  rose: '#e11d48',
  sky: '#0284c7',
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

export type DailyRegistration = { day: string; count: number };

export type AdminChartProps = {
  weeklyRegistrations: DailyRegistration[];
  openJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalReviews: number;
  totalQuotes: number;
  customers: number;
  verifiedPros: number;
  highRiskProviders: number;
};

// ─── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: T.cardBg,
        border: `1px solid ${T.border}`,
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
      }}
    >
      {label && (
        <p style={{ margin: '0 0 4px', fontWeight: 600, color: T.text }}>{label}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: '2px 0', color: entry.color ?? T.muted }}>
          {entry.name && (
            <span style={{ fontWeight: 500 }}>{entry.name}: </span>
          )}
          <span style={{ fontWeight: 700 }}>{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Pie custom label ──────────────────────────────────────────────────────────

function PieLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: '11px', fontWeight: 700 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: T.cardBg,
        border: `1.5px solid ${T.cardBorder}`,
        borderRadius: T.cardRadius,
        boxShadow: T.cardShadow,
        padding: '20px',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: '13px',
          fontWeight: 700,
          color: T.text,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Legend dot ───────────────────────────────────────────────────────────────

function LegendDot({ label, color, value }: { label: string; color: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      <div>
        <p style={{ margin: 0, fontSize: '11px', color: T.muted }}>{label}</p>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: T.text }}>
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminAnalyticsCharts({
  weeklyRegistrations,
  openJobs,
  activeJobs,
  completedJobs,
  totalReviews,
  totalQuotes,
  customers,
  verifiedPros,
  highRiskProviders,
}: AdminChartProps) {
  const jobBarData = [
    { label: 'Open',      value: openJobs,      fill: T.emerald },
    { label: 'Active',    value: activeJobs,    fill: T.sky },
    { label: 'Done',      value: completedJobs, fill: T.navy },
    { label: 'Reviews',   value: totalReviews,  fill: T.violet },
    { label: 'Quotes',    value: totalQuotes,   fill: T.amber },
  ];

  const userPieData = [
    { name: 'Customers',     value: customers,     fill: T.navy },
    { name: 'Verified Pros', value: verifiedPros,  fill: T.emerald },
  ].filter((d) => d.value > 0);

  const normalProviders = Math.max(0, verifiedPros - highRiskProviders);
  const riskPieData = [
    { name: 'High Risk', value: highRiskProviders, fill: T.rose },
    { name: 'Normal',    value: normalProviders,    fill: T.emerald },
  ].filter((d) => d.value > 0);

  return (
    <div>
      {/* Section label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '11px',
            fontWeight: 700,
            color: T.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Charts & Visualisations
        </h2>
        <div style={{ flex: 1, height: '1px', background: T.border }} />
      </div>

      {/* Row 1: Area + Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          marginBottom: '14px',
        }}
      >
        {/* Weekly Registrations — Area */}
        <ChartCard title="New Registrations — Last 7 Days">
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart
              data={weeklyRegistrations}
              margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="regGradChart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.emerald} stopOpacity={0.20} />
                  <stop offset="95%" stopColor={T.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: T.muted }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: T.muted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="Registrations"
                stroke={T.emerald}
                strokeWidth={2}
                fill="url(#regGradChart)"
                dot={{ fill: T.emerald, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: T.emerald }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Platform Activity — Bar */}
        <ChartCard title="Platform Activity">
          <ResponsiveContainer width="100%" height={175}>
            <BarChart
              data={jobBarData}
              margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: T.muted }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: T.muted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                {jobBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Two pie charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
        }}
      >
        {/* User Distribution */}
        {userPieData.length > 0 && (
          <ChartCard title="User Distribution">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ResponsiveContainer width="55%" height={150}>
                <PieChart>
                  <Pie
                    data={userPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel as never}
                  >
                    {userPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userPieData.map((entry) => (
                  <LegendDot
                    key={entry.name}
                    label={entry.name}
                    color={entry.fill}
                    value={entry.value}
                  />
                ))}
              </div>
            </div>
          </ChartCard>
        )}

        {/* Provider Risk Profile */}
        {verifiedPros > 0 && (
          <ChartCard title="Provider Risk Profile">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ResponsiveContainer width="55%" height={150}>
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel as never}
                  >
                    {riskPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {riskPieData.map((entry) => (
                  <LegendDot
                    key={entry.name}
                    label={entry.name}
                    color={entry.fill}
                    value={entry.value}
                  />
                ))}
              </div>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
