export const SPORT_META = {
  RUNNING:     { icon: '🏃', label: 'Running',     color: '#3b82f6' },
  WALKING:     { icon: '🚶', label: 'Walking',     color: '#22c55e' },
  CYCLING:     { icon: '🚴', label: 'Cycling',     color: '#f97316' },
  GYM:         { icon: '🏋️', label: 'Gym',         color: '#ef4444' },
  SWIMMING:    { icon: '🏊', label: 'Swimming',    color: '#06b6d4' },
  DAILY_STEPS: { icon: '👟', label: 'Daily Steps', color: '#a855f7' },
};

export function formatMetric(activity) {
  const { sport, distanceKm, durationMinutes, durationSeconds, stepCount } = activity;
  if (['RUNNING', 'WALKING', 'CYCLING'].includes(sport)) {
    return `${distanceKm} km`;
  }
  if (['GYM', 'SWIMMING'].includes(sport)) {
    const m = durationMinutes ?? 0;
    const s = durationSeconds ?? 0;
    return `${m}m ${s}s`;
  }
  if (sport === 'DAILY_STEPS') {
    return `${stepCount?.toLocaleString()} steps`;
  }
  return '—';
}
