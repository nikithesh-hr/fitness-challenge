import { useState } from 'react';
import { Link } from 'react-router-dom';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardTable({ entries, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);

  if (!entries?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <span className="text-4xl">📋</span>
        <p className="mt-3">No activity recorded yet. Be the first!</p>
      </div>
    );
  }

  function handleDeleteClick(entry) {
    setConfirmId(entry.userId);
  }

  function handleConfirm(entry) {
    setConfirmId(null);
    onDelete?.(entry);
  }

  function handleCancel() {
    setConfirmId(null);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-5 py-3 text-left font-semibold text-gray-500 w-16">Rank</th>
            <th className="px-5 py-3 text-left font-semibold text-gray-500">Athlete</th>
            <th className="px-5 py-3 text-right font-semibold text-gray-500">Total Points</th>
            <th className="px-5 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const medal = MEDALS[entry.rank - 1];
            const isConfirming = confirmId === entry.userId;

            return (
              <tr
                key={entry.userId}
                className={`border-b border-gray-50 transition-colors ${isConfirming ? 'bg-red-50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-5 py-3.5 text-center">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-gray-500 font-mono">#{entry.rank}</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    to={`/dashboard?userId=${entry.userId}`}
                    className="text-gray-800 hover:text-brand-600 hover:underline font-medium transition-colors"
                  >
                    {entry.fullName}
                  </Link>
                  {isConfirming && (
                    <span className="ml-2 text-xs text-red-600 font-medium">
                      Delete this user and all their activities?
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-gray-900">
                    {entry.totalPoints.toLocaleString()}
                    <span className="text-xs text-gray-400">pts</span>
                  </span>
                </td>
                <td className="px-3 py-3.5 text-right">
                  {isConfirming ? (
                    <span className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleConfirm(entry)}
                        className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded transition-colors"
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteClick(entry)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none"
                      aria-label={`Delete ${entry.fullName}`}
                      title="Delete user"
                    >
                      🗑
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
