import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLeaderboard } from '../hooks/useLeaderboard';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import { deleteUser } from '../api/userApi';

const PAGE_SIZE = 10;

export default function LeaderboardPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching, isError, refetch } = useLeaderboard(page, PAGE_SIZE);
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState('');

  const entries     = data?.content ?? [];
  const totalPages  = data?.page?.totalPages ?? 0;
  const totalAthletes = data?.page?.totalElements ?? 0;
  const isFirst     = page === 0;
  const isLast      = page >= totalPages - 1;

  const deleteMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => {
      setDeleteError('');
      // Go back to page 0 after a delete so the table re-sorts cleanly
      setPage(0);
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setDeleteError(err?.message ?? 'Failed to delete user. Please try again.');
    },
  });

  function handleDelete(entry) {
    setDeleteError('');
    deleteMutation.mutate(entry.userId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏆 Global Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-1">Rankings based on total accumulated points</p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm text-brand-600 hover:text-brand-800 border border-brand-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm">
          {deleteError}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-16 text-gray-400">
          <div className="animate-spin text-3xl mb-3">⏳</div>
          <p>Loading rankings…</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
          Failed to load leaderboard. Make sure the backend is running.
        </div>
      )}

      {data && (
        <LeaderboardTable
          entries={entries}
          onDelete={handleDelete}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={isFirst || isFetching}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isLast || isFetching}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {data && (
        <p className="text-xs text-center text-gray-400">
          {totalAthletes} athlete{totalAthletes !== 1 ? 's' : ''} on the board
        </p>
      )}
    </div>
  );
}
