import { ref, get, limitToLast, query, orderByChild, endBefore } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchOlderMessages', () => {
    const mockChatId = 'test-chat-123';
    const mockTimestamp = 1234567890;
    const mockBatchSize = 30;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch older messages successfully', async () => {
      const mockMessages = {
        'msg-1': {
          content: 'Hello',
          senderId: 'user-1',
          timestamp: 1234567800,
          read: true,
          imageUrl: 'image.jpg',
          reactions: { 'user-1': '👍' },
          replyMessage: { id: 'msg-0', content: 'Hi' },
        },
      };

      (get as jest.Mock).mockResolvedValueOnce({
        val: () => mockMessages,
      });

      const result = await Database.fetchOlderMessages(mockChatId, mockTimestamp, mockBatchSize);

      expect(ref).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(orderByChild).toHaveBeenCalledWith('timestamp');
      expect(endBefore).toHaveBeenCalledWith(mockTimestamp);
      expect(limitToLast).toHaveBeenCalledWith(mockBatchSize);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'msg-1',
        content: 'Hello',
        senderId: 'user-1',
        timestamp: 1234567800,
        read: true,
        imageUrl: 'image.jpg',
        reaction: { 'user-1': '👍' },
        replyMessage: { id: 'msg-0', content: 'Hi' },
      });
    });

    it('should return empty array when no messages found', async () => {
      (get as jest.Mock).mockResolvedValueOnce({
        val: () => null,
      });

      const result = await Database.fetchOlderMessages(mockChatId, mockTimestamp);

      expect(result).toEqual([]);
    });

    it('should use default batch size when not provided', async () => {
      (get as jest.Mock).mockResolvedValueOnce({
        val: () => null,
      });

      await Database.fetchOlderMessages(mockChatId, mockTimestamp);

      expect(limitToLast).toHaveBeenCalledWith(50);
    });

    it('should handle messages without optional fields', async () => {
      const mockMessages = {
        'msg-1': {
          content: 'Hello',
          senderId: 'user-1',
          timestamp: 1234567800,
        },
      };

      (get as jest.Mock).mockResolvedValueOnce({
        val: () => mockMessages,
      });

      const result = await Database.fetchOlderMessages(mockChatId, mockTimestamp);

      expect(result[0]).toEqual({
        id: 'msg-1',
        content: 'Hello',
        senderId: 'user-1',
        timestamp: 1234567800,
        read: false,
        imageUrl: null,
        reaction: undefined,
        replyMessage: null,
      });
    });

    it('should throw error when database query fails', async () => {
      const mockError = new Error('Database error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(Database.fetchOlderMessages(mockChatId, mockTimestamp)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
