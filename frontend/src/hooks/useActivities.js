import { useQuery } from '@tanstack/react-query';
import { getActivities } from '../api/userApi';

export function useActivities(userId, page = 0, size = 10) {
  return useQuery({
    queryKey: ['activities', userId, page],
    queryFn: () => getActivities(userId, page, size),
    enabled: !!userId,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
