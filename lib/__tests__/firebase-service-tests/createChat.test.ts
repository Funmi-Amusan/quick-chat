import { get, update, serverTimestamp } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChat', () => {
    const mockCurrentUserId = 'user1';
    const mockCurrentUserName = 'User One';
    const mockOtherUserId = 'user2';
    const mockOtherUserName = 'User Two';
    const expectedChatId = 'user1_user2';

    beforeEach(() => {
      jest.clearAllMocks();
      (serverTimestamp as jest.Mock).mockReturnValue('timestamp');
    });

    it('should return existing chatId if chat already exists', async () => {
      (get as jest.Mock).mockImplementationOnce(() => ({
        exists: () => true,
      }));

      const result = await Database.createChat(
        mockCurrentUserId,
        mockCurrentUserName,
        mockOtherUserId,
        mockOtherUserName
      );

      expect(result).toBe(expectedChatId);
    });

    it('should return existing chatId if chat summary exists', async () => {
      (get as jest.Mock)
        .mockImplementationOnce(() => ({
          exists: () => false,
        }))
        .mockImplementationOnce(() => ({
          exists: () => true,
        }));

      const result = await Database.createChat(
        mockCurrentUserId,
        mockCurrentUserName,
        mockOtherUserId,
        mockOtherUserName
      );

      expect(result).toBe(expectedChatId);
    });

    it('should create new chat with correct data structure', async () => {
      (get as jest.Mock).mockImplementation(() => ({
        exists: () => false,
      }));
      (update as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await Database.createChat(
        mockCurrentUserId,
        mockCurrentUserName,
        mockOtherUserId,
        mockOtherUserName
      );

      expect(update).toHaveBeenCalledWith(expect.any(Object), {
        [`/chats/${expectedChatId}`]: {
          participants: {
            [`${mockCurrentUserId}_${mockCurrentUserName}`]: {
              updatedAt: 'timestamp',
            },
            [`${mockOtherUserId}_${mockOtherUserName}`]: {
              updatedAt: 'timestamp',
            },
          },
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
          lastMessage: null,
          participantNames: {
            [mockCurrentUserId]: mockCurrentUserName,
            [mockOtherUserId]: mockOtherUserName,
          },
        },
        [`/chatsSummary/${expectedChatId}`]: {
          updatedAt: 'timestamp',
          lastMessage: null,
          participantNames: {
            [mockCurrentUserId]: mockCurrentUserName,
            [mockOtherUserId]: mockOtherUserName,
          },
        },
        [`/users/${mockCurrentUserId}/chatsSummary/${expectedChatId}`]: true,
        [`/users/${mockOtherUserId}/chatsSummary/${expectedChatId}`]: true,
      });
      expect(result).toBe(expectedChatId);
    });

    it('should throw error when update fails', async () => {
      (get as jest.Mock).mockImplementation(() => ({
        exists: () => false,
      }));
      const errorMessage = 'Update failed';
      (update as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        Database.createChat(
          mockCurrentUserId,
          mockCurrentUserName,
          mockOtherUserId,
          mockOtherUserName
        )
      ).rejects.toThrow(errorMessage);
    });

    it('should sort userIds correctly for chatId generation', async () => {
      (get as jest.Mock).mockImplementation(() => ({
        exists: () => false,
      }));
      (update as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await Database.createChat(
        'user2',
        mockOtherUserName,
        'user1',
        mockCurrentUserName
      );

      expect(result).toBe('user1_user2');
    });
  });
});
