import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '../api/userApi';

export function useUserSearch(q) {
  return useQuery({
    queryKey: ['users', 'search', q],
    queryFn: () => searchUsers(q),
    enabled: typeof q === 'string' && q.trim().length >= 2,
    staleTime: 10_000,
  });
}
