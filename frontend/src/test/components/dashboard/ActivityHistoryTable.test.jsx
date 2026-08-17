import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActivityHistoryTable from '../../../components/dashboard/ActivityHistoryTable';

vi.mock('../../../hooks/useActivities', () => ({
  useActivities: vi.fn(),
}));

vi.mock('../../../api/activityApi', () => ({
  deleteActivity: vi.fn(),
}));

import { useActivities } from '../../../hooks/useActivities';
import { deleteActivity } from '../../../api/activityApi';

function renderTable(userId = 'user-1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ActivityHistoryTable userId={userId} />
    </QueryClientProvider>
  );
}

const makeActivity = (overrides = {}) => ({
  activityId: 'act-1',
  sport: 'RUNNING',
  distanceKm: 5.25,
  pointsAwarded: 525,
  recordedAt: '2026-08-11T09:00:00',
  ...overrides,
});

describe('ActivityHistoryTable', () => {
  beforeEach(() => {
    useActivities.mockReset();
    deleteActivity.mockReset();
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('shows loading indicator while fetching', () => {
    useActivities.mockReturnValue({ data: undefined, isLoading: true, isFetching: true });
    renderTable();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it('shows "No activities logged yet." when content is empty', () => {
    useActivities.mockReturnValue({
      data: { content: [], totalPages: 0 },
      isLoading: false,
      isFetching: false,
    });
    renderTable();
    expect(screen.getByText(/no activities logged yet/i)).toBeInTheDocument();
  });

  // ── Activity row rendering ────────────────────────────────────────────────

  it('renders sport label from SPORT_META', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity({ sport: 'RUNNING' })], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders sport icon from SPORT_META', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity({ sport: 'RUNNING' })], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText('🏃')).toBeInTheDocument();
  });

  it('renders formatted metric for distance sport (km)', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity({ sport: 'RUNNING', distanceKm: 5.25 })], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText('5.25 km')).toBeInTheDocument();
  });

  it('renders formatted metric for duration sport (min/sec)', () => {
    useActivities.mockReturnValue({
      data: {
        content: [makeActivity({ sport: 'GYM', distanceKm: undefined, durationMinutes: 45, durationSeconds: 50 })],
        totalPages: 1,
      },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText('45m 50s')).toBeInTheDocument();
  });

  it('renders formatted step count for DAILY_STEPS', () => {
    useActivities.mockReturnValue({
      data: {
        content: [makeActivity({ sport: 'DAILY_STEPS', distanceKm: undefined, stepCount: 8450 })],
        totalPages: 1,
      },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText('8,450 steps')).toBeInTheDocument();
  });

  it('renders pointsAwarded with + prefix', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity({ pointsAwarded: 525 })], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText('+525')).toBeInTheDocument();
  });

  // ── Page total footer ─────────────────────────────────────────────────────

  it('shows "Total Points (this page)" footer label', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity({ pointsAwarded: 525 })], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText(/total points \(this page\)/i)).toBeInTheDocument();
  });

  it('footer total sums all pointsAwarded on the page', () => {
    useActivities.mockReturnValue({
      data: {
        content: [
          makeActivity({ activityId: 'a1', pointsAwarded: 525 }),
          makeActivity({ activityId: 'a2', pointsAwarded: 77 }),
        ],
        totalPages: 1,
      },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText('602')).toBeInTheDocument();
  });

  it('footer total is 0 for zero-point activity', () => {
    useActivities.mockReturnValue({
      data: {
        content: [makeActivity({ activityId: 'a1', pointsAwarded: 0 })],
        totalPages: 1,
      },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  it('does NOT show pagination when totalPages is 1', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity()], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.queryByText(/previous/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next/i)).not.toBeInTheDocument();
  });

  it('shows pagination controls when totalPages > 1', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity()], totalPages: 3 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText(/previous/i)).toBeInTheDocument();
    expect(screen.getByText(/next/i)).toBeInTheDocument();
  });

  it('Previous button is disabled on first page', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity()], totalPages: 3 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText(/previous/i).closest('button')).toBeDisabled();
  });

  it('shows correct page label "Page 1 of 3"', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity()], totalPages: 3 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
  });

  // ── Column headers ────────────────────────────────────────────────────────

  it('renders Date, Sport, Metric, Points column headers', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity()], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Sport')).toBeInTheDocument();
    expect(screen.getByText('Metric')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
  });

  // ── Delete button ─────────────────────────────────────────────────────────

  it('shows a delete (trash) button for each activity row', () => {
    useActivities.mockReturnValue({
      data: {
        content: [
          makeActivity({ activityId: 'a1' }),
          makeActivity({ activityId: 'a2' }),
        ],
        totalPages: 1,
      },
      isLoading: false, isFetching: false,
    });
    renderTable();
    expect(screen.getAllByTitle('Delete activity')).toHaveLength(2);
  });

  it('shows "Yes, delete" and "Cancel" buttons after clicking trash icon', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity({ activityId: 'a1' })], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    fireEvent.click(screen.getByTitle('Delete activity'));
    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides the confirmation and shows trash button again after Cancel', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity({ activityId: 'a1' })], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    fireEvent.click(screen.getByTitle('Delete activity'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Yes, delete')).not.toBeInTheDocument();
    expect(screen.getByTitle('Delete activity')).toBeInTheDocument();
  });

  it('calls deleteActivity with the correct activityId on confirm', async () => {
    deleteActivity.mockResolvedValue(undefined);
    useActivities.mockReturnValue({
      data: { content: [makeActivity({ activityId: 'act-42' })], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    fireEvent.click(screen.getByTitle('Delete activity'));
    fireEvent.click(screen.getByText('Yes, delete'));
    await waitFor(() => {
      expect(deleteActivity).toHaveBeenCalledWith('act-42');
    });
  });

  it('does not call deleteActivity when Cancel is clicked', () => {
    useActivities.mockReturnValue({
      data: { content: [makeActivity({ activityId: 'a1' })], totalPages: 1 },
      isLoading: false, isFetching: false,
    });
    renderTable();
    fireEvent.click(screen.getByTitle('Delete activity'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(deleteActivity).not.toHaveBeenCalled();
  });
});
