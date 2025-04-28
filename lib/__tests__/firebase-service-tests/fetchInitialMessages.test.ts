import { ref, get, limitToLast, query, orderByChild } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchInitialMessages', () => {
    const mockChatId = 'test-chat-id';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch messages with default batch size', async () => {
      const mockMessages = {
        msg1: {
          content: 'Hello',
          senderId: 'user1',
          timestamp: 123456789,
        },
        msg2: {
          content: 'Hi',
          senderId: 'user2',
          timestamp: 123456790,
        },
      };

      (get as jest.Mock).mockResolvedValueOnce({
        val: () => mockMessages,
      });

      const result = await Database.fetchInitialMessages(mockChatId);

      expect(ref).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(orderByChild).toHaveBeenCalledWith('timestamp');
      expect(limitToLast).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'msg1',
        content: 'Hello',
        imageUrl: null,
        senderId: 'user1',
        timestamp: 123456789,
        read: false,
        reaction: undefined,
        replyMessage: null,
      });
    });

    it('should fetch messages with custom batch size', async () => {
      (get as jest.Mock).mockResolvedValueOnce({
        val: () => null,
      });

      const result = await Database.fetchInitialMessages(mockChatId, 25);

      expect(limitToLast).toHaveBeenCalledWith(25);
      expect(result).toEqual([]);
    });

    it('should handle messages with optional fields', async () => {
      const mockMessages = {
        msg1: {
          content: 'Hello',
          senderId: 'user1',
          timestamp: 123456789,
          imageUrl: 'image.jpg',
          read: true,
          reactions: { user1: '👍' },
          replyMessage: { id: 'reply1', content: 'Original' },
        },
      };

      (get as jest.Mock).mockResolvedValueOnce({
        val: () => mockMessages,
      });

      const result = await Database.fetchInitialMessages(mockChatId);

      expect(result[0]).toEqual({
        id: 'msg1',
        content: 'Hello',
        imageUrl: 'image.jpg',
        senderId: 'user1',
        timestamp: 123456789,
        read: true,
        reaction: { user1: '👍' },
        replyMessage: { id: 'reply1', content: 'Original' },
      });
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Fetch failed');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(Database.fetchInitialMessages(mockChatId)).rejects.toThrow('Fetch failed');
    });
  });
});
