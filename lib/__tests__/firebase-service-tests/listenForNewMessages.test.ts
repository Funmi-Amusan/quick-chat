import { ref, query, orderByChild, onValue, startAfter } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listenForNewMessages', () => {
    const mockChatId = 'test-chat-id';
    const mockLatestTimestamp = 1234567890;
    const mockOnNewMessage = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should set up message listener with correct query parameters', () => {
      const mockRef = 'messagesRef';
      const mockQuery = 'queryRef';
      (ref as jest.Mock).mockReturnValue(mockRef);
      (query as jest.Mock).mockReturnValue(mockQuery);
      (onValue as jest.Mock).mockReturnValue(() => {});

      Database.listenForNewMessages(mockChatId, mockLatestTimestamp, mockOnNewMessage, mockOnError);

      expect(ref).toHaveBeenCalledWith(expect.anything(), `chats/${mockChatId}/messages`);
      expect(query).toHaveBeenCalledWith(
        mockRef,
        orderByChild('timestamp'),
        startAfter(mockLatestTimestamp)
      );
      expect(onValue).toHaveBeenCalledWith(mockQuery, expect.any(Function), expect.any(Function));
    });

    it('should process new messages and call onNewMessage for each message', () => {
      const mockSnapshot = {
        val: () => ({
          message1: {
            content: 'Hello',
            senderId: 'user1',
            timestamp: 1000,
            read: false,
          },
          message2: {
            content: 'World',
            senderId: 'user2',
            timestamp: 2000,
            imageUrl: 'image.jpg',
            reactions: { user1: '👍' },
          },
        }),
      };

      (onValue as jest.Mock).mockImplementation((query, callback) => {
        callback(mockSnapshot);
        return () => {};
      });

      Database.listenForNewMessages(mockChatId, mockLatestTimestamp, mockOnNewMessage, mockOnError);

      expect(mockOnNewMessage).toHaveBeenCalledTimes(2);
      expect(mockOnNewMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'message1',
          content: 'Hello',
          senderId: 'user1',
          timestamp: 1000,
          read: false,
          imageUrl: null,
          replyMessage: null,
        })
      );
    });

    it('should handle empty message data', () => {
      const mockSnapshot = {
        val: () => null,
      };

      (onValue as jest.Mock).mockImplementation((query, callback) => {
        callback(mockSnapshot);
        return () => {};
      });

      Database.listenForNewMessages(mockChatId, mockLatestTimestamp, mockOnNewMessage, mockOnError);

      expect(mockOnNewMessage).not.toHaveBeenCalled();
    });

    it('should call onError when listener encounters an error', () => {
      const mockError = new Error('Database error');

      (onValue as jest.Mock).mockImplementation((query, callback, errorCallback) => {
        errorCallback(mockError);
        return () => {};
      });

      Database.listenForNewMessages(mockChatId, mockLatestTimestamp, mockOnNewMessage, mockOnError);

      expect(mockOnError).toHaveBeenCalledWith('Database error');
    });

    it('should return unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      (onValue as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = Database.listenForNewMessages(
        mockChatId,
        mockLatestTimestamp,
        mockOnNewMessage,
        mockOnError
      );

      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});
