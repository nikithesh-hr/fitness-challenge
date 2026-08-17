import { useQuery } from '@tanstack/react-query';
import { getRecentUsers } from '../api/userApi';

export function useRecentUsers() {
  return useQuery({
    queryKey: ['users', 'recent'],
    queryFn: getRecentUsers,
    staleTime: 30_000,
  });
}
