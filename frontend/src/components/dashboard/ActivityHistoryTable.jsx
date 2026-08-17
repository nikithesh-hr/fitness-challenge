import { Fragment, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActivities } from '../../hooks/useActivities';
import { deleteActivity } from '../../api/activityApi';
import { SPORT_META, formatMetric } from '../../utils/sportMeta';

function DeleteCell({ activity, userId }) {
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteActivity(activity.activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
    },
  });

  if (mutation.isPending) {
    return <span className="text-xs text-gray-400">Deleting…</span>;
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={() => mutation.mutate()}
          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded transition-colors"
        >
          Yes, delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1 rounded transition-colors"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none"
      aria-label={`Delete activity`}
      title="Delete activity"
    >
      🗑
    </button>
  );
}

function ActivityDetailRow({ a }) {
  const extraEntries = Object.entries(a.extraFields ?? {});
  return (
    <tr>
      <td colSpan={5} className="px-0 pt-0 pb-2">
        <div className="mx-1 bg-slate-50 border border-slate-100 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Activity Details</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
            <Detail label="Recorded At" value={new Date(a.recordedAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })} />
            <Detail label="Sport" value={`${SPORT_META[a.sport]?.icon ?? ''} ${SPORT_META[a.sport]?.label ?? a.sport}`} />
            <Detail label="Metric" value={formatMetric(a)} />
            <Detail label="Points Awarded" value={`+${a.pointsAwarded}`} highlight />
            {a.notes && <Detail label="Notes" value={a.notes} wide />}
          </div>
          {extraEntries.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Extra Fields</p>
              <div className="flex flex-wrap gap-2">
                {extraEntries.map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 rounded-md px-2 py-1">
                    <span className="font-medium text-slate-600">{k}:</span>
                    <span className="text-slate-500">{String(v)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function Detail({ label, value, highlight, wide }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? 'font-semibold text-brand-600' : 'text-slate-700'}`}>
        {value}
      </p>
    </div>
  );
}

export default function ActivityHistoryTable({ userId }) {
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const { data, isLoading, isFetching } = useActivities(userId, page);

  const activities = data?.content ?? [];
  const totalPages = data?.page?.totalPages ?? 0;
  const totalElements = data?.page?.totalElements ?? 0;
  const isFirst = page === 0;
  const isLast = page >= totalPages - 1;

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-600 mb-4">Activity History</h3>

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No activities logged yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase">Sport</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase">Metric</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase">Points</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activities.map((a) => {
                  const meta = SPORT_META[a.sport] ?? {};
                  const isExpanded = expandedId === a.activityId;
                  return (
                    <Fragment key={a.activityId}>
                      <tr
                        onClick={() => toggleExpand(a.activityId)}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="py-2.5 text-gray-500">
                          {new Date(a.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span>{meta.icon}</span>
                            <span className="text-gray-700">{meta.label ?? a.sport}</span>
                          </span>
                        </td>
                        <td className="py-2.5 text-gray-600">{formatMetric(a)}</td>
                        <td className="py-2.5 text-right font-mono font-semibold text-brand-600">
                          +{a.pointsAwarded}
                        </td>
                        <td className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <DeleteCell activity={a} userId={userId} />
                        </td>
                      </tr>
                      {isExpanded && <ActivityDetailRow a={a} />}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={isFirst || isFetching}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-400">
              Page {page + 1} of {totalPages || 1}
              {totalElements > 0 && ` · ${totalElements} activities`}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isLast || isFetching}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
