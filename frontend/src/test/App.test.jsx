import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import LogActivityPage from '../pages/LogActivityPage';
import DashboardPage from '../pages/DashboardPage';
import LeaderboardPage from '../pages/LeaderboardPage';

vi.mock('../components/forms/RegisterForm', () => ({
  default: () => <div>Mock Register Form</div>,
}));

vi.mock('../components/forms/LogActivityForm', () => ({
  default: () => <div>Mock Log Activity Form</div>,
}));

vi.mock('../components/forms/UserSearchPicker', () => ({
  default: ({ onSelect }) => (
    <button type="button" onClick={() => onSelect?.({ userId: 'u-1', firstName: 'Jane', lastName: 'Smith' })}>
      Mock User Picker
    </button>
  ),
}));

vi.mock('../components/dashboard/StatsCards', () => ({
  default: ({ totalPoints, totalActivities }) => (
    <div>{`Stats ${totalPoints} ${totalActivities}`}</div>
  ),
}));

vi.mock('../components/dashboard/SportBreakdownChart', () => ({
  default: ({ sportBreakdown }) => <div>{`Breakdown ${Object.keys(sportBreakdown).length}`}</div>,
}));

vi.mock('../components/dashboard/WeeklyVolumeChart', () => ({
  default: ({ weeklyVolume }) => <div>{`Weekly ${weeklyVolume.length}`}</div>,
}));

vi.mock('../components/dashboard/ActivityHistoryTable', () => ({
  default: ({ userId }) => <div>{`History ${userId}`}</div>,
}));

vi.mock('../components/leaderboard/LeaderboardTable', () => ({
  default: ({ entries, onDelete }) => (
    <div>
      <div>{`Entries ${entries.length}`}</div>
      <button type="button" onClick={() => onDelete?.({ userId: 'u-1' })}>Delete First</button>
    </div>
  ),
}));

vi.mock('../hooks/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../hooks/useLeaderboard', () => ({
  useLeaderboard: vi.fn(),
}));

vi.mock('../api/userApi', async () => {
  const actual = await vi.importActual('../api/userApi');
  return {
    ...actual,
    deleteUser: vi.fn(),
  };
});

import { useDashboard } from '../hooks/useDashboard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { deleteUser } from '../api/userApi';

function renderAt(path) {
  window.history.pushState({}, '', path);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  );
}

function renderWithClient(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      {ui}
    </QueryClientProvider>
  );
}

describe('App routing', () => {
  it('renders home page on /', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: /fitness challenge/i })).toBeInTheDocument();
    expect(screen.getByText(/quick links/i)).toBeInTheDocument();
  });

  it('renders register page on /register', () => {
    renderAt('/register');
    expect(screen.getByText(/create account/i)).toBeInTheDocument();
    expect(screen.getByText('Mock Register Form')).toBeInTheDocument();
  });

  it('renders log activity page on /log-activity', () => {
    renderAt('/log-activity');
    expect(screen.getByRole('heading', { name: /log activity/i })).toBeInTheDocument();
    expect(screen.getByText('Mock Log Activity Form')).toBeInTheDocument();
  });
});

describe('HomePage', () => {
  it('renders quick links and scoring rows', () => {
    renderWithClient(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getAllByRole('link', { name: /register|log activity|leaderboard|dashboard|get started|view leaderboard/i }).length).toBeGreaterThan(0);
    expect(screen.getByText('100 pts / km')).toBeInTheDocument();
    expect(screen.getByText(/1 pt \/ 100 steps/i)).toBeInTheDocument();
  });
});

describe('RegisterPage and LogActivityPage', () => {
  it('renders register wrapper content', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/join the fitness challenge/i)).toBeInTheDocument();
    expect(screen.getByText('Mock Register Form')).toBeInTheDocument();
  });

  it('renders log activity wrapper content', () => {
    render(<LogActivityPage />);
    expect(screen.getByText(/record your workout/i)).toBeInTheDocument();
    expect(screen.getByText('Mock Log Activity Form')).toBeInTheDocument();
  });
});

describe('DashboardPage', () => {
  beforeEach(() => {
    useDashboard.mockReset();
  });

  it('shows search prompt when no user is selected', () => {
    useDashboard.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    window.history.pushState({}, '', '/dashboard');
    renderWithClient(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/search for a user above/i)).toBeInTheDocument();
    expect(screen.getByText('Mock User Picker')).toBeInTheDocument();
  });

  it('shows leaderboard context when userId comes from query string', () => {
    useDashboard.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    renderWithClient(
      <MemoryRouter initialEntries={['/dashboard?userId=abc']}>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/viewing dashboard from leaderboard/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to leaderboard/i })).toHaveAttribute('href', '/leaderboard');
  });

  it('shows loading and error states', () => {
    useDashboard
      .mockReturnValueOnce({ data: undefined, isLoading: true, isError: false, error: null })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: true, error: { message: 'Boom' } });

    const { rerender } = renderWithClient(
      <MemoryRouter initialEntries={['/dashboard?userId=abc']}>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <MemoryRouter initialEntries={['/dashboard?userId=abc']}>
        <DashboardPage />
      </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('renders dashboard content when data is available', () => {
    useDashboard.mockReturnValue({
      data: {
        fullName: 'Jane Smith',
        userId: 'u-1',
        totalPoints: 120,
        totalActivities: 3,
        sportBreakdown: { RUNNING: 100 },
        weeklyVolume: [{ week: '2026-08-11', totalPoints: 100 }],
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithClient(
      <MemoryRouter initialEntries={['/dashboard?userId=u-1']}>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Stats 120 3')).toBeInTheDocument();
    expect(screen.getByText('Breakdown 1')).toBeInTheDocument();
    expect(screen.getByText('Weekly 1')).toBeInTheDocument();
    expect(screen.getByText('History u-1')).toBeInTheDocument();
  });
});

describe('LeaderboardPage', () => {
  beforeEach(() => {
    useLeaderboard.mockReset();
    deleteUser.mockReset();
  });

  it('shows loading and error states', () => {
    useLeaderboard
      .mockReturnValueOnce({ data: undefined, isLoading: true, isFetching: false, isError: false, refetch: vi.fn() })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isFetching: false, isError: true, refetch: vi.fn() });

    const { rerender } = renderWithClient(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading rankings/i)).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText(/failed to load leaderboard/i)).toBeInTheDocument();
  });

  it('renders entries, athlete count, and refresh', () => {
    const refetch = vi.fn();
    useLeaderboard.mockReturnValue({
      data: { content: [{ userId: 'u-1' }], page: { totalPages: 1, totalElements: 1 } },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch,
    });

    renderWithClient(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(refetch).toHaveBeenCalled();
    expect(screen.getByText('Entries 1')).toBeInTheDocument();
    expect(screen.getByText(/1 athlete on the board/i)).toBeInTheDocument();
  });

  it('shows pagination when totalPages is greater than 1', () => {
    useLeaderboard.mockReturnValue({
      data: { content: [{ userId: 'u-1' }], page: { totalPages: 3, totalElements: 25 } },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithClient(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/previous/i).closest('button')).toBeDisabled();
  });
});
