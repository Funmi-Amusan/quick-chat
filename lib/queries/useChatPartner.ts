import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import * as Database from '~/lib/firebase-sevice';

export const CURRENT_USER_QUERY_KEY = 'chatPartner';

export function useChatPartner(currentUserId: string | undefined, chatId: string | undefined) {
  return useQuery({
    queryKey: [CURRENT_USER_QUERY_KEY, chatId, currentUserId],
    queryFn: async () => {
      if (!chatId || !currentUserId) {
        router.back();
        throw new Error('Chat ID or User ID is missing.');
      }
      const partnerInfo = await Database.fetchChatPartnerInfo(chatId, currentUserId);
      if (!partnerInfo) {
        router.back();
        throw new Error('Chat partner not found.');
      }
      return partnerInfo;
    },
    enabled: !!chatId && !!currentUserId,
    staleTime: Infinity,
    refetchInterval: 1000 * 60 * 12,
  });
}
