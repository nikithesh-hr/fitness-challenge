import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import StatsCards from '../components/dashboard/StatsCards';
import SportBreakdownChart from '../components/dashboard/SportBreakdownChart';
import WeeklyVolumeChart from '../components/dashboard/WeeklyVolumeChart';
import ActivityHistoryTable from '../components/dashboard/ActivityHistoryTable';
import UserSearchPicker from '../components/forms/UserSearchPicker';

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const paramUserId = searchParams.get('userId');

  const [selectedUser, setSelectedUser] = useState(null);

  // Prefer URL param (coming from leaderboard click) over picker selection
  const userId = paramUserId ?? selectedUser?.userId ?? null;

  const { data, isLoading, isError, error } = useDashboard(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Personal Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {paramUserId
              ? 'Viewing dashboard from leaderboard'
              : 'Search for a user to view their fitness activity, volume trends, and sport breakdown'}
          </p>
        </div>
        {paramUserId && (
          <Link
            to="/leaderboard"
            className="text-sm text-brand-600 hover:text-brand-800 border border-brand-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            ← Back to Leaderboard
          </Link>
        )}
      </div>

      {/* Only show the picker when NOT navigated from the leaderboard */}
      {!paramUserId && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <UserSearchPicker
            showRegister={false}
            onSelect={(user) => setSelectedUser(user)}
          />
        </div>
      )}

      {isLoading && (
        <div className="text-center py-16 text-gray-400">
          <div className="animate-spin text-3xl mb-3">⏳</div>
          <p>Loading dashboard…</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
          {error?.message ?? 'Failed to load dashboard. Please try again.'}
        </div>
      )}

      {!userId && !isLoading && (
        <div className="text-center py-16 text-gray-300">
          <span className="text-5xl">👤</span>
          <p className="mt-3 text-sm">Search for a user above to view their dashboard</p>
        </div>
      )}

      {data && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{data.fullName}</h2>
              <p className="text-xs text-gray-400 font-mono">{data.userId}</p>
            </div>
          </div>

          <StatsCards totalPoints={data.totalPoints} totalActivities={data.totalActivities} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SportBreakdownChart sportBreakdown={data.sportBreakdown ?? {}} />
            <WeeklyVolumeChart weeklyVolume={data.weeklyVolume ?? []} />
          </div>

          <ActivityHistoryTable userId={data.userId} />
        </>
      )}
    </div>
  );
}
