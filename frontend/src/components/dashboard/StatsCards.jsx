export default function StatsCards({ totalPoints, totalActivities }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Points</p>
        <p className="mt-2 text-3xl font-bold text-brand-600">{totalPoints.toLocaleString()}</p>
        <p className="mt-1 text-xs text-gray-400">cumulative score</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Activities</p>
        <p className="mt-2 text-3xl font-bold text-gray-800">{totalActivities}</p>
        <p className="mt-1 text-xs text-gray-400">sessions logged</p>
      </div>
    </div>
  );
}
