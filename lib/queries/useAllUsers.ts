import { useQuery } from '@tanstack/react-query';

import { fetchAllUsers } from '~/lib/firebase-sevice';

export const ALL_USERS_QUERY_KEY = 'allUsers';

type UseAllUsersOptions = {
  enabled?: boolean;
};

export function useAllUsers(currentUserId: string | undefined, options: UseAllUsersOptions = {}) {
  return useQuery({
    queryKey: [ALL_USERS_QUERY_KEY, currentUserId],
    queryFn: () => {
      if (!currentUserId) {
        throw new Error('User not authenticated for fetching users.');
      }
      return fetchAllUsers(currentUserId);
    },
    enabled: !!currentUserId && options.enabled !== false,
    staleTime: 60 * 60 * 1000, // 60 minutes
  });
}
