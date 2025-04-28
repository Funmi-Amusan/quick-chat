import { get } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchChatPartnerInfo', () => {
    it('should throw error when chat metadata not found', async () => {
      (get as jest.Mock).mockImplementationOnce(() => ({
        exists: () => false,
      }));

      await expect(Database.fetchChatPartnerInfo('invalid-chat', 'user-1')).rejects.toThrow(
        'Chat metadata not found.'
      );
    });

    it('should return partner info when found', async () => {
      const mockChatData = {
        exists: () => true,
        val: () => ({
          participants: {
            'user-1_name': {},
            'user-2_name': {},
          },
        }),
      };

      const mockUserData = {
        exists: () => true,
        val: () => ({
          username: 'TestUser',
          isLoggedIn: true,
        }),
      };

      const mockStatusData = {
        exists: () => true,
        val: () => ({
          isActive: true,
          isTyping: false,
          lastActive: 123456,
        }),
      };

      (get as jest.Mock)
        .mockImplementationOnce(() => mockChatData)
        .mockImplementationOnce(() => mockUserData)
        .mockImplementationOnce(() => mockStatusData);

      const result = await Database.fetchChatPartnerInfo('chat-1', 'user-1');

      expect(result).toEqual({
        id: 'user-2',
        username: 'TestUser',
        isActive: true,
        isTyping: false,
        lastActive: 123456,
        isLoggedIn: true,
      });
    });
  });
});
