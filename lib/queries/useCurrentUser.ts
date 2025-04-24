import { useQuery } from '@tanstack/react-query';

import { auth } from '~/lib/firebase-config';

export const CURRENT_USER_QUERY_KEY = 'currentUser';

export function useCurrentUser() {
  return useQuery({
    queryKey: [CURRENT_USER_QUERY_KEY],
    queryFn: () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }
      return user;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000 * 24,
  });
}
