import { get, onValue } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listenToUserChats', () => {
    const mockUserId = 'test-user-123';
    const mockCallback = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle empty chat data', () => {
      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          val: () => null,
        });
        return jest.fn();
      });

      Database.listenToUserChats(mockUserId, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should process valid chat data correctly', async () => {
      const mockChatData = {
        'chat-1': true,
        'chat-2': true,
      };

      const mockChatSummaries = {
        'chat-1': {
          lastMessage: 'Hello',
          participantNames: {
            'test-user-123': 'TestUser',
            'partner-123': 'Partner1',
          },
          updatedAt: 123456789,
        },
        'chat-2': {
          lastMessage: 'Hi there',
          participantNames: {
            'test-user-123': 'TestUser',
            'partner-456': 'Partner2',
          },
          updatedAt: 123456790,
        },
      };

      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          val: () => mockChatData,
        });
        return jest.fn();
      });

      (get as jest.Mock).mockImplementation((ref) => {
        const chatId = ref.toString().split('/').pop();
        return Promise.resolve({
          exists: () => true,
          val: () => mockChatSummaries[chatId],
        });
      });

      Database.listenToUserChats(mockUserId, mockCallback);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle chat data not found', async () => {
      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          val: () => ({ 'chat-1': true }),
        });
        return jest.fn();
      });

      (get as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          exists: () => false,
          val: () => null,
        })
      );

      Database.listenToUserChats(mockUserId, mockCallback);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should handle errors in chat data fetching', async () => {
      const mockError = new Error('Database error');

      (onValue as jest.Mock).mockImplementation((ref, callback, errorCallback) => {
        errorCallback(mockError);
        return jest.fn();
      });

      Database.listenToUserChats(mockUserId, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([], mockError);
    });

    it('should handle anonymous partners', async () => {
      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          val: () => ({ 'chat-1': true }),
        });
        return jest.fn();
      });

      (get as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({
            lastMessage: 'Hello',
            participantNames: {
              'test-user-123': 'TestUser',
            },
            updatedAt: 123456789,
          }),
        })
      );

      Database.listenToUserChats(mockUserId, mockCallback);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCallback).toHaveBeenCalledWith([
        {
          id: 'chat-1',
          lastMessage: 'Hello',
          partner: 'Anonymous',
          partnerId: '',
          updatedAt: 123456789,
        },
      ]);
    });
  });
});
