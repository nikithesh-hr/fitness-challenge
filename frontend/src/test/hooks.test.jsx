import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useActivities } from '../hooks/useActivities';
import { useDashboard } from '../hooks/useDashboard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useRecentUsers } from '../hooks/useRecentUsers';
import { useUserSearch } from '../hooks/useUserSearch';

vi.mock('../api/userApi', async () => {
  const actual = await vi.importActual('../api/userApi');
  return {
    ...actual,
    getActivities: vi.fn(),
    getDashboard: vi.fn(),
    getRecentUsers: vi.fn(),
    searchUsers: vi.fn(),
  };
});

vi.mock('../api/leaderboardApi', async () => {
  const actual = await vi.importActual('../api/leaderboardApi');
  return {
    ...actual,
    getLeaderboard: vi.fn(),
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

import { useQuery } from '@tanstack/react-query';
import { getActivities, getDashboard, getRecentUsers, searchUsers } from '../api/userApi';
import { getLeaderboard } from '../api/leaderboardApi';

function wrapper({ children }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('query hooks', () => {
  beforeEach(() => {
    useQuery.mockReset();
    useQuery.mockReturnValue({ data: [] });
    getActivities.mockReset();
    getDashboard.mockReset();
    getRecentUsers.mockReset();
    searchUsers.mockReset();
    getLeaderboard.mockReset();
  });

  it('useActivities builds the expected query config and queryFn calls getActivities', async () => {
    getActivities.mockResolvedValue({ content: [] });
    renderHook(() => useActivities('u-1', 2, 15), { wrapper });
    const config = useQuery.mock.calls[0][0];
    expect(config).toEqual(expect.objectContaining({
      queryKey: ['activities', 'u-1', 2],
      enabled: true,
      staleTime: 30_000,
      placeholderData: expect.any(Function),
      queryFn: expect.any(Function),
    }));
    await config.queryFn();
    expect(getActivities).toHaveBeenCalledWith('u-1', 2, 15);
    expect(config.placeholderData('prev')).toBe('prev');
  });

  it('useActivities disables the query when userId is missing', () => {
    renderHook(() => useActivities('', 0, 10), { wrapper });
    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('useDashboard builds the expected query config and queryFn calls getDashboard', async () => {
    getDashboard.mockResolvedValue({});
    renderHook(() => useDashboard('u-2'), { wrapper });
    const config = useQuery.mock.calls[0][0];
    expect(config).toEqual(expect.objectContaining({
      queryKey: ['dashboard', 'u-2'],
      enabled: true,
      staleTime: 30_000,
      queryFn: expect.any(Function),
    }));
    await config.queryFn();
    expect(getDashboard).toHaveBeenCalledWith('u-2');
  });

  it('useDashboard disables the query without a userId', () => {
    renderHook(() => useDashboard(null), { wrapper });
    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('useLeaderboard builds the expected query config and queryFn calls getLeaderboard', async () => {
    getLeaderboard.mockResolvedValue({});
    renderHook(() => useLeaderboard(3, 20), { wrapper });
    const config = useQuery.mock.calls[0][0];
    expect(config).toEqual(expect.objectContaining({
      queryKey: ['leaderboard', 3],
      staleTime: 30_000,
      placeholderData: expect.any(Function),
      queryFn: expect.any(Function),
    }));
    await config.queryFn();
    expect(getLeaderboard).toHaveBeenCalledWith(3, 20);
    expect(config.placeholderData('prev')).toBe('prev');
  });

  it('useRecentUsers builds the expected query config and queryFn calls getRecentUsers', async () => {
    getRecentUsers.mockResolvedValue([]);
    renderHook(() => useRecentUsers(), { wrapper });
    const config = useQuery.mock.calls[0][0];
    expect(config).toEqual(expect.objectContaining({
      queryKey: ['users', 'recent'],
      staleTime: 30_000,
      queryFn: expect.any(Function),
    }));
    await config.queryFn();
    expect(getRecentUsers).toHaveBeenCalled();
  });

  it('useUserSearch enables only for trimmed queries with at least 2 chars', async () => {
    searchUsers.mockResolvedValue([]);
    renderHook(() => useUserSearch('a'), { wrapper });
    expect(useQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));

    renderHook(() => useUserSearch('  ab  '), { wrapper });
    const config = useQuery.mock.calls.at(-1)[0];
    expect(config).toEqual(expect.objectContaining({
      queryKey: ['users', 'search', '  ab  '],
      enabled: true,
      staleTime: 10_000,
      queryFn: expect.any(Function),
    }));
    await config.queryFn();
    expect(searchUsers).toHaveBeenCalledWith('  ab  ');
  });
});
