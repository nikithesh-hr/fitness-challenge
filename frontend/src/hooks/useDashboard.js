import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/userApi';

export function useDashboard(userId) {
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => getDashboard(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
