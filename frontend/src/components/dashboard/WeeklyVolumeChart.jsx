import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Parse "YYYY-MM-DD" safely — no timezone shift.
 * Returns null for any other format (empty string, "YYYY-WW", etc.)
 */
function parseDate(ymd) {
  if (!ymd || typeof ymd !== 'string') return null;
  const parts = ymd.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

/** "YYYY-MM-DD" → "Aug 03" */
function toShortLabel(ymd) {
  const dt = parseDate(ymd);
  if (!dt) return '';
  return `${MONTH_SHORT[dt.getMonth()]} ${String(dt.getDate()).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" → "Aug" */
function toMonthLabel(ymd) {
  const dt = parseDate(ymd);
  if (!dt) return '';
  return MONTH_SHORT[dt.getMonth()];
}

/** Add 7 days to a "YYYY-MM-DD" → "YYYY-MM-DD". */
function addWeek(ymd) {
  const dt = parseDate(ymd);
  if (!dt) return ymd;
  dt.setDate(dt.getDate() + 7);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Fill every Monday between first and last week with zero-data entries
 * so the axis is always continuous (no skipped weeks).
 * Filters out any items with invalid or missing `week` strings first.
 */
function fillMissingWeeks(weeklyVolume) {
  const valid = (weeklyVolume ?? []).filter(item => parseDate(item.week) !== null);
  if (!valid.length) return [];
  if (valid.length === 1) return valid;

  const byKey = new Map(valid.map(item => [item.week, item]));
  const result = [];
  let cur = valid[0].week;
  const last = valid[valid.length - 1].week;

  while (cur <= last) {
    result.push(byKey.get(cur) ?? { week: cur, totalPoints: 0, activityCount: 0 });
    cur = addWeek(cur);
  }
  return result;
}

/**
 * Precompute a label string for every data point.
 * ≤ 8 weeks  → "Aug 03", "Aug 10" on every tick.
 * > 8 weeks  → "Aug 03", "Sep 07" on the first tick of each new month, "" for all others.
 * Uses index comparison — no mutable Set, safe across re-renders.
 */
function buildLabels(data) {
  if (data.length <= 8) {
    return data.map(item => toShortLabel(item.week));
  }
  return data.map((item, i) => {
    if (i === 0) return toShortLabel(item.week);
    const prevMonth = toMonthLabel(data[i - 1].week);
    const curMonth  = toMonthLabel(item.week);
    return prevMonth !== curMonth ? toShortLabel(item.week) : '';
  });
}

function compactNumber(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return v;
}

export default function WeeklyVolumeChart({ weeklyVolume }) {
  const data   = fillMissingWeeks(weeklyVolume);
  const labels = buildLabels(data);

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-1">Volume Over Time</h3>
        <p className="text-sm text-gray-400 text-center py-8">No weekly data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-600 mb-4">Volume Over Time</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="week"
            tickFormatter={(_, index) => labels[index] ?? ''}
            tick={{ fontSize: 11 }}
            tickLine={false}
            interval={0}

          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={compactNumber}
            width={45}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString()} pts`, 'Points']}
            labelFormatter={(week) => toShortLabel(week)}
          />
          <Line
            type="linear"
            dataKey="totalPoints"
            name="Points"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
