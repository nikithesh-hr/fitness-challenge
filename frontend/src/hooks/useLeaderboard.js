import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../api/leaderboardApi';

export function useLeaderboard(page = 0, size = 10) {
  return useQuery({
    queryKey: ['leaderboard', page],
    queryFn: () => getLeaderboard(page, size),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
